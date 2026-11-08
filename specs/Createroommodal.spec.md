Add test cases for the CreaterroomModel component
# Test Specification: CreateRoomModal Component

Comprehensive test specifications, test suites, and edge-case validations for [`CreateRoomModal.jsx`](../src/components/CreatorRooms/CreateRoomModal.jsx).

---

## 1. Component Overview & Architecture

`CreateRoomModal` is a 5-step interactive wizard modal used by room creators to configure and publish or draft an **Accountability Room**.

### Component Props
| Prop | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `close` | `Function` (`() => void`) | Yes | Closes the modal and unmounts/hides it. |
| `create` | `Function` (`(payload: RoomPayload) => Promise<void>`) | Yes | Async callback that receives the final room configuration payload and persists it to the database. |

### 5-Step Wizard Flow
1. **Step 1: Basics & Commitment Pledge** (Title, Emoji Cover, Description, Category, Visibility, Group Commitment Pledge).
2. **Step 2: Schedule & Proof Requirements** (Duration / Ongoing, Start Date, Daily Deadline, Proof of Work types, Standup form fields).
3. **Step 3: Verification & Accountability Buddies** (Peer Verification toggle, Verifier role, Buddy pairing, Buddy change & nudges).
4. **Step 4: Stakes, Rules & Membership** (Completion reward presets, gBits stake toggle, Reward pool rules, Missed check-in policy, Room guidelines, Max members).
5. **Step 5: Live Room Preview & Publish** (High-fidelity preview card, "Save as Draft", "Create Accountability Room").

---

## 2. Test Suites & Test Cases

### Suite 1: Rendering, Mount & Initial State
- [ ] **TC-1.1: Default Render**
  - Verify modal mounts with backdrop blur and enter animation.
  - Verify top glow accent bar and header title `"Create Accountability Room"` are visible.
  - Verify stepper indicator displays `"Step 1 of 5"`.
- [ ] **TC-1.2: Default Form Field Values**
  - `title`: `""` (empty)
  - `coverIcon`: `"⚡"`
  - `goalPledge`: `""` (empty)
  - `description`: `""` (empty)
  - `category`: `"Coding & DSA"` (first category option)
  - `visibility`: `"Public"`
  - `durationDays`: `30`
  - `isOngoing`: `false`
  - `startDate`: Today's ISO date string (`YYYY-MM-DD`)
  - `checkinDeadline`: `"11:59 PM IST"`
  - `selectedProofTypes`: `["Project/Demo Link", "Screenshot"]`
  - `accomplishmentRequired`: `true`
  - `proofRequired`: `true`
  - `blockersRequired`: `false`
  - `tomorrowGoalRequired`: `false`
  - `verificationRequired`: `true`
  - `whoCanVerify`: `"Any Room Member"`
  - `enableBuddy`: `true`
  - `allowBuddyChange`: `true`
  - `allowBuddyNudges`: `true`
  - `completionReward`: `150`
  - `enableGbitsStake`: `false`
  - `entryStake`: `50`
  - `maxMembers`: `25`
- [ ] **TC-1.3: Dismissal Interactions**
  - Clicking the `X` icon in the top right calls `close()`.
  - Clicking the dark backdrop (outside the modal box) calls `close()`.
  - Clicking inside the modal container does **not** trigger `close()`.

---

### Suite 2: Step 1 - Basics & Pledge Validation
- [ ] **TC-2.1: Input State Binding**
  - Changing Room Title input updates `title`.
  - Changing Group Commitment Pledge input updates `goalPledge`.
  - Changing Description textarea updates `description`.
  - Changing Category via `CustomSelect` updates `category`.
  - Changing Visibility via `CustomSelect` updates `visibility`.
  - Changing Cover Icon updates `coverIcon`.
- [ ] **TC-2.2: `isStep1Valid` Validation Guard**
  - When `title`, `description`, or `goalPledge` are empty strings, `isStep1Valid` must evaluate to `false`.
  - Whitespace-only strings (`"   "`) must evaluate to `false` (via `.trim()`).
  - When all three fields contain non-whitespace characters, `isStep1Valid` evaluates to `true`.
- [ ] **TC-2.3: Navigation Controls on Step 1**
  - When invalid, the **Next Step** button is disabled (`disabled` attribute present, opacity reduced).
  - When valid, the **Next Step** button is enabled and has the active gradient background.
  - Clicking **Cancel** on Step 1 calls `close()`.

---

### Suite 3: Step 2 - Schedule, Timeline & Proof of Work
- [ ] **TC-3.1: Step Navigation**
  - Clicking **Next Step** on Step 1 advances stepper to `step = 2`.
  - Header updates to display `"Step 2 of 5"`.
  - Clicking **Previous Step** returns to `step = 1`.
- [ ] **TC-3.2: Room Duration Numeric Input**
  - Entering a valid integer (e.g. `45`) updates `durationDays`.
  - Entering invalid/empty input handles fallback cleanly (minimum `1`).
  - Clamping handles values between `1` and `365`.
- [ ] **TC-3.3: Duration Quick Preset Chips**
  - Clicking preset chips (`7d`, `14d`, `30d`, `60d`, `100d`) sets `durationDays` to the respective value.
  - Ensures `isOngoing` is reset to `false` when a numeric preset is clicked.
  - Selected preset button applies active styling (`border-[#00F0FF]/40 text-[#00F0FF]`).
- [ ] **TC-3.4: "Ongoing Room" Checkbox Toggle**
  - Checking "Ongoing Room" disables fixed day duration and displays `"Continuous squad (no fixed end date)"`.
  - Unchecking restores numeric duration input.
- [ ] **TC-3.5: Room Start Date & Helper Calculations**
  - Default start date equals today (`min` attribute prevents past dates).
  - Selecting a future date displays correct `"Starts in X days"` helper text.
  - Clicking `"Set Today"` resets start date to the current date.
- [ ] **TC-3.6: `computeEndDate` Pure Function Unit Test**
  - `computeEndDate("2026-11-08", 30)` returns `"2026-12-08"`.
  - Correctly handles month transitions and leap years using UTC arithmetic.
  - When `isOngoing` is `true`, timeline card displays ongoing label instead of an end date.
- [ ] **TC-3.7: Proof Types Multi-Selection**
  - Clicking an unselected proof type adds it to `selectedProofTypes`.
  - Clicking a selected proof type removes it from `selectedProofTypes`.
  - **Guard:** If only 1 proof type is selected, attempting to deselect it does not remove it (at least one proof type must remain selected).
- [ ] **TC-3.8: Daily Standup Form Fields Toggles**
  - "Accomplishment" is statically marked as "Required".
  - Clicking "Proof of Work" toggles between "Required" and "Optional".
  - Clicking "Blockers" toggles between "Required" and "Optional".
  - Clicking "Tomorrow's Goal" toggles between "Required" and "Optional".

---

### Suite 4: Step 3 - Peer Verification & Accountability Buddies
- [ ] **TC-4.1: Peer Verification Toggle**
  - Toggling "Enable Peer Verification" switches `verificationRequired` boolean.
  - When disabled (`false`), the "Who Can Verify?" select dropdown is hidden.
  - When enabled (`true`), the dropdown is visible with options:
    - `"Any Room Member"`
    - `"Accountability Buddy"`
    - `"Room Host"`
    - `"Host + Members"`
- [ ] **TC-4.2: Accountability Buddies Toggle**
  - Toggling "Enable Accountability Buddies" switches `enableBuddy` boolean.
  - When disabled (`false`), nested toggles ("Allow Buddy Change" & "Allow Buddy Nudges") are hidden.
  - When enabled (`true`), both nested switches can be toggled independently.
- [ ] **TC-4.3: Global Uptime Integration Badge**
  - Verify static information card renders explaining the single source of truth for uptime.

---

### Suite 5: Step 4 - Stakes, Rules & Membership
- [ ] **TC-5.1: Sprint Completion Reward (gBits)**
  - Direct input accepts positive integers up to `10000`.
  - Clicking preset reward buttons (`50`, `100`, `150`, `200`, `300`, `500`) updates `completionReward`.
  - Active preset button applies pink glow and border styling.
- [ ] **TC-5.2: gBits Commitment Stake (Optional)**
  - Toggling "Enable gBits Commitment Stake" switches `enableGbitsStake`.
  - When enabled, shows:
    - `entryStake` numeric input.
    - `rewardPoolRules` select dropdown.
    - `missedCheckinPolicy` select dropdown.
  - When disabled, stake configuration inputs are hidden.
- [ ] **TC-5.3: Room Guidelines & Membership Limit**
  - `roomRules` textarea updates state on user edit.
  - `maxMembers` numeric input updates state on user edit.

---

### Suite 6: Step 5 - Preview & Publication
- [ ] **TC-6.1: Live Room Preview Card Data Reflection**
  - Preview card accurately reflects:
    - `coverIcon` emoji.
    - `category` badge.
    - Duration badge (`"Ongoing"` or `"{durationDays} Days"`).
    - `title` (or fallback `"Untitled Room"`).
    - `description`.
    - `visibility` badge.
    - `goalPledge` inside the group commitment pledge card.
    - Room Timeline: `startDate` → `endDate`.
    - Daily deadline text.
    - Count of selected proof types.
    - Entry stake display (`"Free"` or `"{entryStake} gBits"`).
- [ ] **TC-6.2: "Save as Draft" Action**
  - Clicking "Save as Draft":
    - Calls `close()` immediately.
    - Calls `create(roomPayload)` where `is_draft: true`.
    - Sets submitting state to prevent multiple simultaneous submissions.
- [ ] **TC-6.3: "Create Accountability Room" (Publish) Action**
  - Clicking "Create Accountability Room ✦":
    - Calls `close()` immediately.
    - Calls `create(roomPayload)` where `is_draft: false`.
    - Formats payload according to schema (see Payload Contract below).
- [ ] **TC-6.4: Submission Payload Contract**
  ```json
  {
    "title": "String (trimmed)",
    "name": "String (trimmed)",
    "description": "String (trimmed)",
    "category": "String",
    "cover_icon": "String",
    "visibility": "Public | Private | Invite Only",
    "goal_pledge": "String (trimmed)",
    "duration_type": "30_day | ongoing",
    "start_date": "YYYY-MM-DD",
    "end_date": "YYYY-MM-DD | null",
    "checkin_deadline": "String",
    "proof_types": ["String"],
    "verification_system": {
      "required": true,
      "who_can_verify": "String"
    },
    "buddy_system": {
      "enabled": true
    },
    "gbits_stake": {
      "enabled": false,
      "entry_stake": 0,
      "completion_reward": 150,
      "reward_rules": "String",
      "missed_policy": "String"
    },
    "rules": {
      "room_rules": "String",
      "code_of_conduct": "String"
    },
    "membership": {
      "max_members": 25
    },
    "is_draft": false
  }
  ```

---

### Suite 7: Stepper Header & Direct Step Navigation
- [ ] **TC-7.1: Pill Stepper Clicks**
  - Clicking any previous step pill (`s.id < currentStep`) switches to that step directly.
  - Clicking future step pills (`s.id > currentStep`) is allowed **only if** `isStep1Valid` is true.
  - Completed steps display a green checkmark icon (`<Check size={12} />`).
  - Active step displays gradient highlight with shadow.

---

### Suite 8: Edge Cases, Boundaries & Error Handling
- [ ] **TC-8.1: Double-Click Prevention**
  - When `submitting` is true, buttons are disabled and subsequent clicks are ignored.
- [ ] **TC-8.2: Start Date in the Past**
  - Attempting to manually pass past dates is clamped/blocked by the HTML `min` attribute.
- [ ] **TC-8.3: Special Characters & Long Strings**
  - Long strings in title/pledge do not break card UI layout (uses proper text overflow and wrapping).
  - Unicode/emojis in title and descriptions are preserved in the payload.
- [ ] **TC-8.4: Modal Dismiss on External Esc Key**
  - (If supported by root event listeners) pressing `Escape` invokes `close()`.

---

## 3. Production Jest & React Testing Library Test Suite

> **Source File**: [`src/components/CreatorRooms/__tests__/CreateRoomModal.test.jsx`](../src/components/CreatorRooms/__tests__/CreateRoomModal.test.jsx)

```javascript
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateRoomModal from "../CreateRoomModal";

// Mock Framer Motion to prevent animation delays in Jest
jest.mock("framer-motion", () => {
  const React = require("react");
  return {
    motion: {
      div: React.forwardRef(({ children, ...props }, ref) => (
        <div ref={ref} {...props}>{children}</div>
      )),
      button: React.forwardRef(({ children, ...props }, ref) => (
        <button ref={ref} {...props}>{children}</button>
      )),
    },
    AnimatePresence: ({ children }) => <>{children}</>,
  };
});

describe("CreateRoomModal (Jest + React Testing Library)", () => {
  let mockClose;
  let mockCreate;

  beforeEach(() => {
    mockClose = jest.fn();
    mockCreate = jest.fn().mockResolvedValue({ id: "mock-room-123" });
    jest.clearAllMocks();
  });

  const renderModal = () => {
    return render(<CreateRoomModal close={mockClose} create={mockCreate} />);
  };

  const fillStep1 = async (user, overrides = {}) => {
    const titleInput = screen.getByPlaceholderText(/30 Days of Code/i);
    const pledgeInput = screen.getByPlaceholderText(/Ship 1 GitHub commit/i);
    const descInput = screen.getByPlaceholderText(/What is this room about/i);

    await user.type(titleInput, overrides.title || "Fullstack DSA Sprint");
    await user.type(pledgeInput, overrides.pledge || "1 LeetCode problem daily");
    await user.type(descInput, overrides.desc || "Daily algorithmic practice for 30 days");
  };

  it("renders modal header and default Step 1 correctly", () => {
    renderModal();
    expect(screen.getByText("Create Accountability Room")).toBeInTheDocument();
    expect(screen.getByText("Step 1 of 5")).toBeInTheDocument();
  });

  it("disables Next button when Step 1 is empty and enables when filled", async () => {
    const user = userEvent.setup();
    renderModal();

    const nextBtn = screen.getByRole("button", { name: /Next Step/i });
    expect(nextBtn).toBeDisabled();

    await fillStep1(user);
    expect(nextBtn).toBeEnabled();
  });

  it("navigates through wizard steps and submits published room payload", async () => {
    const user = userEvent.setup();
    renderModal();

    // Step 1
    await fillStep1(user, { title: "Jest Test Room" });
    await user.click(screen.getByRole("button", { name: /Next Step/i })); // to 2

    // Step 2
    expect(screen.getByText("Step 2 of 5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Next Step/i })); // to 3

    // Step 3
    expect(screen.getByText("Step 3 of 5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Next Step/i })); // to 4

    // Step 4
    expect(screen.getByText("Step 4 of 5")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Next Step/i })); // to 5

    // Step 5: Live Preview & Publish
    expect(screen.getByText("Step 5 of 5")).toBeInTheDocument();
    expect(screen.getByText("Jest Test Room")).toBeInTheDocument();

    const publishBtn = screen.getByRole("button", { name: /Create Accountability Room ✦/i });
    await user.click(publishBtn);

    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Jest Test Room",
        name: "Jest Test Room",
        is_draft: false,
      })
    );
  });

  it("submits draft payload (is_draft = true) when clicking 'Save as Draft'", async () => {
    const user = userEvent.setup();
    renderModal();

    await fillStep1(user, { title: "Draft Sprint" });
    await user.click(screen.getByRole("button", { name: /Next Step/i })); // 2
    await user.click(screen.getByRole("button", { name: /Next Step/i })); // 3
    await user.click(screen.getByRole("button", { name: /Next Step/i })); // 4
    await user.click(screen.getByRole("button", { name: /Next Step/i })); // 5

    const draftBtn = screen.getByRole("button", { name: /Save as Draft/i });
    await user.click(draftBtn);

    expect(mockClose).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Draft Sprint",
        is_draft: true,
      })
    );
  });
});
```

---

## 4. Backend Database & API Integration Tests (Supabase)

> **Source File**: [`tests/backend/creatorRooms.test.js`](../tests/backend/creatorRooms.test.js)

Tests table persistence, payload schemas, and Row Level Security (RLS) anti-abuse rules for Room Creation on Supabase:
- **Table Health**: Verifies `creator_rooms` exists and accepts queries without PGRST205 errors.
- **Payload Schema Validation**: Asserts all JSONB keys (`verification_system`, `buddy_system`, `gbits_stake`, `rules`, `membership`) are present.
- **Row Level Security**: Asserts unauthenticated clients cannot overwrite room properties.
- **Date Consistency**: Verifies UTC start/end date arithmetic.
