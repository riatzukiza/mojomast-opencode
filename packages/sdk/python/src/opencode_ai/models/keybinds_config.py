from collections.abc import Mapping
from typing import Any, TypeVar, Union

from attrs import define as _attrs_define

from ..types import UNSET, Unset

T = TypeVar("T", bound="KeybindsConfig")


@_attrs_define
class KeybindsConfig:
    """Custom keybind configurations

    Attributes:
        leader (Union[Unset, str]): Leader key for keybind combinations Default: 'ctrl+x'.
        app_exit (Union[Unset, str]): Exit the application Default: 'ctrl+c,ctrl+d,<leader>q'.
        editor_open (Union[Unset, str]): Open external editor Default: '<leader>e'.
        theme_list (Union[Unset, str]): List available themes Default: '<leader>t'.
        sidebar_toggle (Union[Unset, str]): Toggle sidebar Default: '<leader>b'.
        status_view (Union[Unset, str]): View status Default: '<leader>s'.
        session_export (Union[Unset, str]): Export session to editor Default: '<leader>x'.
        session_new (Union[Unset, str]): Create a new session Default: '<leader>n'.
        session_list (Union[Unset, str]): List all sessions Default: '<leader>l'.
        session_timeline (Union[Unset, str]): Show session timeline Default: '<leader>g'.
        session_share (Union[Unset, str]): Share current session Default: 'none'.
        session_unshare (Union[Unset, str]): Unshare current session Default: 'none'.
        session_interrupt (Union[Unset, str]): Interrupt current session Default: 'escape'.
        session_compact (Union[Unset, str]): Compact session Default: '<leader>c'.
        messages_page_up (Union[Unset, str]): Scroll messages up by one page Default: 'pageup'.
        messages_page_down (Union[Unset, str]): Scroll messages down by one page Default: 'pagedown'.
        messages_half_page_up (Union[Unset, str]): Scroll messages up by half page Default: 'ctrl+alt+u'.
        messages_half_page_down (Union[Unset, str]): Scroll messages down by half page Default: 'ctrl+alt+d'.
        messages_first (Union[Unset, str]): Navigate to first message Default: 'ctrl+g,home'.
        messages_last (Union[Unset, str]): Navigate to last message Default: 'ctrl+alt+g,end'.
        messages_copy (Union[Unset, str]): Copy message Default: '<leader>y'.
        messages_undo (Union[Unset, str]): Undo message Default: '<leader>u'.
        messages_redo (Union[Unset, str]): Redo message Default: '<leader>r'.
        messages_toggle_conceal (Union[Unset, str]): Toggle code block concealment in messages Default: '<leader>h'.
        model_list (Union[Unset, str]): List available models Default: '<leader>m'.
        model_cycle_recent (Union[Unset, str]): Next recently used model Default: 'f2'.
        model_cycle_recent_reverse (Union[Unset, str]): Previous recently used model Default: 'shift+f2'.
        command_list (Union[Unset, str]): List available commands Default: 'ctrl+p'.
        agent_list (Union[Unset, str]): List agents Default: '<leader>a'.
        agent_cycle (Union[Unset, str]): Next agent Default: 'tab'.
        agent_cycle_reverse (Union[Unset, str]): Previous agent Default: 'shift+tab'.
        input_clear (Union[Unset, str]): Clear input field Default: 'ctrl+c'.
        input_forward_delete (Union[Unset, str]): Forward delete Default: 'ctrl+d'.
        input_paste (Union[Unset, str]): Paste from clipboard Default: 'ctrl+v'.
        input_submit (Union[Unset, str]): Submit input Default: 'return'.
        input_newline (Union[Unset, str]): Insert newline in input Default: 'shift+return,ctrl+j'.
        history_previous (Union[Unset, str]): Previous history item Default: 'up'.
        history_next (Union[Unset, str]): Previous history item Default: 'down'.
        session_child_cycle (Union[Unset, str]): Next child session Default: 'ctrl+right'.
        session_child_cycle_reverse (Union[Unset, str]): Previous child session Default: 'ctrl+left'.
    """

    leader: Union[Unset, str] = "ctrl+x"
    app_exit: Union[Unset, str] = "ctrl+c,ctrl+d,<leader>q"
    editor_open: Union[Unset, str] = "<leader>e"
    theme_list: Union[Unset, str] = "<leader>t"
    sidebar_toggle: Union[Unset, str] = "<leader>b"
    status_view: Union[Unset, str] = "<leader>s"
    session_export: Union[Unset, str] = "<leader>x"
    session_new: Union[Unset, str] = "<leader>n"
    session_list: Union[Unset, str] = "<leader>l"
    session_timeline: Union[Unset, str] = "<leader>g"
    session_share: Union[Unset, str] = "none"
    session_unshare: Union[Unset, str] = "none"
    session_interrupt: Union[Unset, str] = "escape"
    session_compact: Union[Unset, str] = "<leader>c"
    messages_page_up: Union[Unset, str] = "pageup"
    messages_page_down: Union[Unset, str] = "pagedown"
    messages_half_page_up: Union[Unset, str] = "ctrl+alt+u"
    messages_half_page_down: Union[Unset, str] = "ctrl+alt+d"
    messages_first: Union[Unset, str] = "ctrl+g,home"
    messages_last: Union[Unset, str] = "ctrl+alt+g,end"
    messages_copy: Union[Unset, str] = "<leader>y"
    messages_undo: Union[Unset, str] = "<leader>u"
    messages_redo: Union[Unset, str] = "<leader>r"
    messages_toggle_conceal: Union[Unset, str] = "<leader>h"
    model_list: Union[Unset, str] = "<leader>m"
    model_cycle_recent: Union[Unset, str] = "f2"
    model_cycle_recent_reverse: Union[Unset, str] = "shift+f2"
    command_list: Union[Unset, str] = "ctrl+p"
    agent_list: Union[Unset, str] = "<leader>a"
    agent_cycle: Union[Unset, str] = "tab"
    agent_cycle_reverse: Union[Unset, str] = "shift+tab"
    input_clear: Union[Unset, str] = "ctrl+c"
    input_forward_delete: Union[Unset, str] = "ctrl+d"
    input_paste: Union[Unset, str] = "ctrl+v"
    input_submit: Union[Unset, str] = "return"
    input_newline: Union[Unset, str] = "shift+return,ctrl+j"
    history_previous: Union[Unset, str] = "up"
    history_next: Union[Unset, str] = "down"
    session_child_cycle: Union[Unset, str] = "ctrl+right"
    session_child_cycle_reverse: Union[Unset, str] = "ctrl+left"

    def to_dict(self) -> dict[str, Any]:
        leader = self.leader

        app_exit = self.app_exit

        editor_open = self.editor_open

        theme_list = self.theme_list

        sidebar_toggle = self.sidebar_toggle

        status_view = self.status_view

        session_export = self.session_export

        session_new = self.session_new

        session_list = self.session_list

        session_timeline = self.session_timeline

        session_share = self.session_share

        session_unshare = self.session_unshare

        session_interrupt = self.session_interrupt

        session_compact = self.session_compact

        messages_page_up = self.messages_page_up

        messages_page_down = self.messages_page_down

        messages_half_page_up = self.messages_half_page_up

        messages_half_page_down = self.messages_half_page_down

        messages_first = self.messages_first

        messages_last = self.messages_last

        messages_copy = self.messages_copy

        messages_undo = self.messages_undo

        messages_redo = self.messages_redo

        messages_toggle_conceal = self.messages_toggle_conceal

        model_list = self.model_list

        model_cycle_recent = self.model_cycle_recent

        model_cycle_recent_reverse = self.model_cycle_recent_reverse

        command_list = self.command_list

        agent_list = self.agent_list

        agent_cycle = self.agent_cycle

        agent_cycle_reverse = self.agent_cycle_reverse

        input_clear = self.input_clear

        input_forward_delete = self.input_forward_delete

        input_paste = self.input_paste

        input_submit = self.input_submit

        input_newline = self.input_newline

        history_previous = self.history_previous

        history_next = self.history_next

        session_child_cycle = self.session_child_cycle

        session_child_cycle_reverse = self.session_child_cycle_reverse

        field_dict: dict[str, Any] = {}

        field_dict.update({})
        if leader is not UNSET:
            field_dict["leader"] = leader
        if app_exit is not UNSET:
            field_dict["app_exit"] = app_exit
        if editor_open is not UNSET:
            field_dict["editor_open"] = editor_open
        if theme_list is not UNSET:
            field_dict["theme_list"] = theme_list
        if sidebar_toggle is not UNSET:
            field_dict["sidebar_toggle"] = sidebar_toggle
        if status_view is not UNSET:
            field_dict["status_view"] = status_view
        if session_export is not UNSET:
            field_dict["session_export"] = session_export
        if session_new is not UNSET:
            field_dict["session_new"] = session_new
        if session_list is not UNSET:
            field_dict["session_list"] = session_list
        if session_timeline is not UNSET:
            field_dict["session_timeline"] = session_timeline
        if session_share is not UNSET:
            field_dict["session_share"] = session_share
        if session_unshare is not UNSET:
            field_dict["session_unshare"] = session_unshare
        if session_interrupt is not UNSET:
            field_dict["session_interrupt"] = session_interrupt
        if session_compact is not UNSET:
            field_dict["session_compact"] = session_compact
        if messages_page_up is not UNSET:
            field_dict["messages_page_up"] = messages_page_up
        if messages_page_down is not UNSET:
            field_dict["messages_page_down"] = messages_page_down
        if messages_half_page_up is not UNSET:
            field_dict["messages_half_page_up"] = messages_half_page_up
        if messages_half_page_down is not UNSET:
            field_dict["messages_half_page_down"] = messages_half_page_down
        if messages_first is not UNSET:
            field_dict["messages_first"] = messages_first
        if messages_last is not UNSET:
            field_dict["messages_last"] = messages_last
        if messages_copy is not UNSET:
            field_dict["messages_copy"] = messages_copy
        if messages_undo is not UNSET:
            field_dict["messages_undo"] = messages_undo
        if messages_redo is not UNSET:
            field_dict["messages_redo"] = messages_redo
        if messages_toggle_conceal is not UNSET:
            field_dict["messages_toggle_conceal"] = messages_toggle_conceal
        if model_list is not UNSET:
            field_dict["model_list"] = model_list
        if model_cycle_recent is not UNSET:
            field_dict["model_cycle_recent"] = model_cycle_recent
        if model_cycle_recent_reverse is not UNSET:
            field_dict["model_cycle_recent_reverse"] = model_cycle_recent_reverse
        if command_list is not UNSET:
            field_dict["command_list"] = command_list
        if agent_list is not UNSET:
            field_dict["agent_list"] = agent_list
        if agent_cycle is not UNSET:
            field_dict["agent_cycle"] = agent_cycle
        if agent_cycle_reverse is not UNSET:
            field_dict["agent_cycle_reverse"] = agent_cycle_reverse
        if input_clear is not UNSET:
            field_dict["input_clear"] = input_clear
        if input_forward_delete is not UNSET:
            field_dict["input_forward_delete"] = input_forward_delete
        if input_paste is not UNSET:
            field_dict["input_paste"] = input_paste
        if input_submit is not UNSET:
            field_dict["input_submit"] = input_submit
        if input_newline is not UNSET:
            field_dict["input_newline"] = input_newline
        if history_previous is not UNSET:
            field_dict["history_previous"] = history_previous
        if history_next is not UNSET:
            field_dict["history_next"] = history_next
        if session_child_cycle is not UNSET:
            field_dict["session_child_cycle"] = session_child_cycle
        if session_child_cycle_reverse is not UNSET:
            field_dict["session_child_cycle_reverse"] = session_child_cycle_reverse

        return field_dict

    @classmethod
    def from_dict(cls: type[T], src_dict: Mapping[str, Any]) -> T:
        d = dict(src_dict)
        leader = d.pop("leader", UNSET)

        app_exit = d.pop("app_exit", UNSET)

        editor_open = d.pop("editor_open", UNSET)

        theme_list = d.pop("theme_list", UNSET)

        sidebar_toggle = d.pop("sidebar_toggle", UNSET)

        status_view = d.pop("status_view", UNSET)

        session_export = d.pop("session_export", UNSET)

        session_new = d.pop("session_new", UNSET)

        session_list = d.pop("session_list", UNSET)

        session_timeline = d.pop("session_timeline", UNSET)

        session_share = d.pop("session_share", UNSET)

        session_unshare = d.pop("session_unshare", UNSET)

        session_interrupt = d.pop("session_interrupt", UNSET)

        session_compact = d.pop("session_compact", UNSET)

        messages_page_up = d.pop("messages_page_up", UNSET)

        messages_page_down = d.pop("messages_page_down", UNSET)

        messages_half_page_up = d.pop("messages_half_page_up", UNSET)

        messages_half_page_down = d.pop("messages_half_page_down", UNSET)

        messages_first = d.pop("messages_first", UNSET)

        messages_last = d.pop("messages_last", UNSET)

        messages_copy = d.pop("messages_copy", UNSET)

        messages_undo = d.pop("messages_undo", UNSET)

        messages_redo = d.pop("messages_redo", UNSET)

        messages_toggle_conceal = d.pop("messages_toggle_conceal", UNSET)

        model_list = d.pop("model_list", UNSET)

        model_cycle_recent = d.pop("model_cycle_recent", UNSET)

        model_cycle_recent_reverse = d.pop("model_cycle_recent_reverse", UNSET)

        command_list = d.pop("command_list", UNSET)

        agent_list = d.pop("agent_list", UNSET)

        agent_cycle = d.pop("agent_cycle", UNSET)

        agent_cycle_reverse = d.pop("agent_cycle_reverse", UNSET)

        input_clear = d.pop("input_clear", UNSET)

        input_forward_delete = d.pop("input_forward_delete", UNSET)

        input_paste = d.pop("input_paste", UNSET)

        input_submit = d.pop("input_submit", UNSET)

        input_newline = d.pop("input_newline", UNSET)

        history_previous = d.pop("history_previous", UNSET)

        history_next = d.pop("history_next", UNSET)

        session_child_cycle = d.pop("session_child_cycle", UNSET)

        session_child_cycle_reverse = d.pop("session_child_cycle_reverse", UNSET)

        keybinds_config = cls(
            leader=leader,
            app_exit=app_exit,
            editor_open=editor_open,
            theme_list=theme_list,
            sidebar_toggle=sidebar_toggle,
            status_view=status_view,
            session_export=session_export,
            session_new=session_new,
            session_list=session_list,
            session_timeline=session_timeline,
            session_share=session_share,
            session_unshare=session_unshare,
            session_interrupt=session_interrupt,
            session_compact=session_compact,
            messages_page_up=messages_page_up,
            messages_page_down=messages_page_down,
            messages_half_page_up=messages_half_page_up,
            messages_half_page_down=messages_half_page_down,
            messages_first=messages_first,
            messages_last=messages_last,
            messages_copy=messages_copy,
            messages_undo=messages_undo,
            messages_redo=messages_redo,
            messages_toggle_conceal=messages_toggle_conceal,
            model_list=model_list,
            model_cycle_recent=model_cycle_recent,
            model_cycle_recent_reverse=model_cycle_recent_reverse,
            command_list=command_list,
            agent_list=agent_list,
            agent_cycle=agent_cycle,
            agent_cycle_reverse=agent_cycle_reverse,
            input_clear=input_clear,
            input_forward_delete=input_forward_delete,
            input_paste=input_paste,
            input_submit=input_submit,
            input_newline=input_newline,
            history_previous=history_previous,
            history_next=history_next,
            session_child_cycle=session_child_cycle,
            session_child_cycle_reverse=session_child_cycle_reverse,
        )

        return keybinds_config