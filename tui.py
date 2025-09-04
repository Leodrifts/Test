#!/usr/bin/env python3
"""Simple text-based user interface with sidebar menu."""
import curses
import getpass

MENU_ITEMS = ["Home", "Settings", "Config"]


def draw_menu(stdscr: "curses._CursesWindow", selected: int) -> None:
    """Render the sidebar and main content based on the selection."""
    stdscr.clear()

    sidebar_width = 20
    for idx, item in enumerate(MENU_ITEMS):
        mode = curses.A_REVERSE if idx == selected else curses.A_NORMAL
        stdscr.addstr(idx + 1, 1, item, mode)

    if MENU_ITEMS[selected] == "Home":
        message = f"Hello {getpass.getuser()}"
    elif MENU_ITEMS[selected] == "Settings":
        message = "Settings screen"
    else:
        message = "Config screen"
    stdscr.addstr(1, sidebar_width + 2, message)
    stdscr.refresh()


def main(stdscr: "curses._CursesWindow") -> None:
    curses.curs_set(0)
    stdscr.keypad(True)
    selected = 0
    draw_menu(stdscr, selected)
    while True:
        key = stdscr.getch()
        if key in (curses.KEY_UP, ord("k")):
            selected = (selected - 1) % len(MENU_ITEMS)
        elif key in (curses.KEY_DOWN, ord("j")):
            selected = (selected + 1) % len(MENU_ITEMS)
        elif key in (ord("q"), 27):
            break
        draw_menu(stdscr, selected)


if __name__ == "__main__":
    curses.wrapper(main)
