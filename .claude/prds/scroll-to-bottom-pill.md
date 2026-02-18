# PRD: Scroll-to-Bottom Pill

**Ticket:** None (ad-hoc request, 2026-02-18)
**Status:** Complete
**Created:** 2026-02-18
**Last Updated:** 2026-02-18

## Summary

When a user is scrolled up in a chat room and new messages arrive, a floating pill appears
at the bottom of the message list showing "↓ N new". Clicking the pill scrolls to the latest
message and dismisses it. No pill appears if the user is already at the bottom.

## Requirements

### Original Requirements
- Floating "↓ N new" pill at the bottom of MessageList when scrolled up and new messages arrive
- Clicking the pill scrolls to bottom and clears the counter
- No indicator shown when already at the bottom

### Discovered Requirements
- Pill must also dismiss when user manually scrolls to within 60px of the bottom
- Initial mount should snap to bottom instantly (not smooth), so history loads below the fold without animation jitter
- `isAtBottom` must be tracked via a ref (not just state) to avoid stale closure in the messages effect

## Architecture

### Design Decisions
- Wrapper `div` uses `relative flex-1 overflow-hidden`; inner scroll container uses `absolute inset-0 overflow-y-auto` to allow absolute-positioning the pill overlay
- `isAtBottomRef` is a sync ref so the `messages.length` effect always reads the current scroll state without needing it in the dependency array
- `prevLengthRef` initialized to `null` and set in mount effect so the `messages.length` effect can skip the initial render cleanly

## Implementation

### Component Inventory
| Component | Type | Path | Purpose | Status |
|-----------|------|------|---------|--------|
| MessageList | React component | `client/src/components/MessageList.jsx` | Scroll tracking + pill UI | Complete |

### Key Logic
- `handleScroll`: fires on every scroll event, updates `isAtBottomRef` + `isAtBottom` state; clears `newCount` if at bottom
- Mount `useEffect`: snaps to bottom instantly, initialises `prevLengthRef`
- `messages.length` `useEffect`: computes diff since last render; if at bottom → smooth scroll, else → increment pill counter

## Changelog

### [FEAT] Scroll-to-bottom pill — 2026-02-18
- Added scroll tracking (`isAtBottomRef`, `prevLengthRef`, `newCount` state)
- Restructured layout: `relative` wrapper + `absolute inset-0` scroll container enables pill overlay
- Pill renders with `animate-appear`, magenta border + glow, uppercase tracking
- Files affected: `client/src/components/MessageList.jsx`
