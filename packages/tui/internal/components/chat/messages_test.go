package chat

import (
	"testing"

	"github.com/sst/opencode-sdk-go"
	"github.com/sst/opencode/internal/app"
)

func TestFormatThreeTokenMetrics(t *testing.T) {
	tests := []struct {
		name              string
		currentContext    float64
		sessionTotal      float64
		requestTokens     float64
		contextWindow     float64
		cost              float64
		isSubscription    bool
		expectedSubstring string
	}{
		{
			name:              "small numbers",
			currentContext:    500,
			sessionTotal:      1500,
			requestTokens:     1000,
			contextWindow:     8000,
			cost:              0.05,
			isSubscription:    false,
			expectedSubstring: "ctx:500 sess:1.5K req:1K/6% ($0.05)",
		},
		{
			name:              "thousands format",
			currentContext:    1500,
			sessionTotal:      2500,
			requestTokens:     2000,
			contextWindow:     8000,
			cost:              0.10,
			isSubscription:    false,
			expectedSubstring: "ctx:1.5K sess:2.5K req:2K/18% ($0.10)",
		},
		{
			name:              "subscription model",
			currentContext:    1500,
			sessionTotal:      2500,
			requestTokens:     2000,
			contextWindow:     8000,
			cost:              0.00,
			isSubscription:    true,
			expectedSubstring: "ctx:1.5K sess:2.5K req:2K/18% ($0.00)",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := formatThreeTokenMetrics(
				tt.currentContext,
				tt.sessionTotal,
				tt.requestTokens,
				tt.contextWindow,
				tt.cost,
				tt.isSubscription,
			)

			if result == "" {
				t.Error("Expected result to not be empty")
			}

			// Check that expected substrings are present
			if !contains(result, tt.expectedSubstring) {
				t.Errorf("Expected result to contain '%s', got '%s'", tt.expectedSubstring, result)
			}
		})
	}
}

func TestTokenCalculationLogic(t *testing.T) {
	// Test data matching the structure used in messages.go
	messages := []app.Message{
		{
			Info: opencode.UserMessage{
				ID:        "user-1",
				SessionID: "session-1",
				Time: opencode.UserMessageTime{
					Created: 1234567890,
				},
			},
		},
		{
			Info: opencode.AssistantMessage{
				ID:        "assistant-1",
				SessionID: "session-1",
				Role:      "assistant",
				Time: opencode.AssistantMessageTime{
					Created:   1234567891,
					Completed: 1234567900,
				},
				Cost: 0.05,
				Tokens: opencode.AssistantMessageTokens{
					Input:     1000,
					Output:    500,
					Reasoning: 200,
					Cache: opencode.AssistantMessageTokensCache{
						Read:  100,
						Write: 50,
					},
				},
				Summary: false,
			},
		},
		{
			Info: opencode.AssistantMessage{
				ID:        "assistant-2",
				SessionID: "session-1",
				Role:      "assistant",
				Time: opencode.AssistantMessageTime{
					Created:   1234567901,
					Completed: 1234567950,
				},
				Cost: 0.03,
				Tokens: opencode.AssistantMessageTokens{
					Input:     800,
					Output:    400,
					Reasoning: 150,
					Cache: opencode.AssistantMessageTokensCache{
						Read:  80,
						Write: 40,
					},
				},
				Summary: true,
			},
		},
		{
			Info: opencode.AssistantMessage{
				ID:        "assistant-3",
				SessionID: "session-1",
				Role:      "assistant",
				Time: opencode.AssistantMessageTime{
					Created:   1234567951,
					Completed: 1234568000,
				},
				Cost: 0.07,
				Tokens: opencode.AssistantMessageTokens{
					Input:     1200,
					Output:    600,
					Reasoning: 300,
					Cache: opencode.AssistantMessageTokensCache{
						Read:  120,
						Write: 60,
					},
				},
				Summary: false,
			},
		},
	}

	// Test the token calculation logic
	var sessionTokens, requestTokens float64
	var lastNonSummaryTokens float64

	for _, message := range messages {
		if assistant, ok := message.Info.(opencode.AssistantMessage); ok {
			// Accumulate for session total
			sessionTokens += assistant.Tokens.Input + assistant.Tokens.Output + assistant.Tokens.Reasoning + assistant.Tokens.Cache.Read + assistant.Tokens.Cache.Write

			// Track last non-summary message for current context
			if !assistant.Summary && assistant.Tokens.Output > 0 {
				lastNonSummaryTokens = assistant.Tokens.Input + assistant.Tokens.Cache.Read + assistant.Tokens.Cache.Write + assistant.Tokens.Output + assistant.Tokens.Reasoning
			}

			// Calculate total request tokens (cumulative input sent to provider)
			requestTokens += assistant.Tokens.Input
		}
	}

	// Verify calculations
	expectedSessionTokens := (1000 + 500 + 200 + 100 + 50) + (800 + 400 + 150 + 80 + 40) + (1200 + 600 + 300 + 120 + 60) // 5650
	expectedRequestTokens := 1000 + 800 + 1200                                                                           // 3000
	expectedCurrentContext := 1200 + 120 + 60 + 600 + 300                                                                // 2280

	if sessionTokens != float64(expectedSessionTokens) {
		t.Errorf("Expected session tokens to be %d, got %f", expectedSessionTokens, sessionTokens)
	}

	if requestTokens != float64(expectedRequestTokens) {
		t.Errorf("Expected request tokens to be %d, got %f", expectedRequestTokens, requestTokens)
	}

	if lastNonSummaryTokens != float64(expectedCurrentContext) {
		t.Errorf("Expected current context tokens to be %d, got %f", expectedCurrentContext, lastNonSummaryTokens)
	}

	// Test the formatting function
	formatted := formatThreeTokenMetrics(lastNonSummaryTokens, sessionTokens, requestTokens, 8000, 0.15, false)

	if formatted == "" {
		t.Error("Expected formatted token metrics to not be empty")
	}

	// Test with subscription model (cost is 0)
	formattedSub := formatThreeTokenMetrics(lastNonSummaryTokens, sessionTokens, requestTokens, 8000, 0, true)
	if formattedSub == "" {
		t.Error("Expected formatted token metrics for subscription model to not be empty")
	}
}

// Helper function to check if a string contains a substring
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(substr) == 0 ||
		(len(s) > len(substr) &&
			(s[:len(substr)] == substr ||
				s[len(s)-len(substr):] == substr ||
				indexOf(s, substr) >= 0)))
}

func indexOf(s, substr string) int {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return i
		}
	}
	return -1
}
