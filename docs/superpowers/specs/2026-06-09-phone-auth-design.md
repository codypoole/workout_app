# Phone Authentication Login Screen

## Summary

Replace anonymous + Google auth with Firebase phone authentication as the sole login method. The login screen is the first thing users see. All workout data remains tied to the authenticated user via the existing `users/{uid}` Firestore document.

## Auth Flow

1. User opens app with no session -> login screen renders
2. User enters phone number (defaulting to +1 country code) -> taps "Send Code"
3. Invisible reCAPTCHA verifies silently -> Firebase sends SMS
4. UI transitions to 6-digit OTP input -> user enters code -> taps "Verify"
5. `onAuthStateChanged` fires with the authenticated user -> Store loads/creates `users/{uid}` doc -> main app renders

## UI Design

**LoginScreen** — new component with two states:

- **phone-entry**: Dumbbell icon, "Workout" title, phone number text field with +1 prefix, "Send Code" primary button. Error message area below.
- **code-verify**: Same header, 6-digit code input field, "Verify" primary button, "Back" link to return to phone entry. Error message area below.

Visual style: matches existing dark theme and accent system. Uses existing `.btn.primary`, `.field`, design tokens. Minimal and focused.

## Store Changes

- Remove `signInAnonymously` call from `initFirebase` — when `onAuthStateChanged` fires with `null`, set status to `unauthenticated` instead of creating an anonymous session
- Remove `signInWithGoogle` and `linkWithPopup` logic
- Add new status value `unauthenticated` to `StoreStatus`
- Add `signInWithPhone(phoneNumber: string): Promise<ConfirmationResult>` — creates invisible reCAPTCHA, calls `signInWithPhoneNumber`
- Add `confirmPhoneCode(code: string): Promise<void>` — calls `confirmationResult.confirm(code)`, which triggers `onAuthStateChanged`
- `onAuthStateChanged` listener logic stays the same for authenticated users

## App.tsx Changes

- When `status === 'unauthenticated'`, render `<LoginScreen>` instead of the tab-based app
- Pass `store.signInWithPhone` and `store.confirmPhoneCode` as props (or access store directly)
- Once authenticated, the normal app renders as today

## SettingsSheet Changes

- Remove Google sign-in button and `googleAuthEnabled` references
- Show the user's phone number from `account.phoneNumber` instead of email/displayName
- Keep sign-out button (which now returns user to the login screen)

## Firebase Setup

- `app/src/lib/firebase.ts`: export `RecaptchaVerifier` and `signInWithPhoneNumber` from `firebase/auth`
- Remove `googleAuthEnabled` export
- No Firestore rules changes needed (already require `request.auth != null`)

## Files Touched

| File | Change |
|------|--------|
| `app/src/screens/LoginScreen.tsx` | New file — two-step phone auth UI |
| `app/src/data/store.ts` | Replace anon/Google auth with phone auth methods, add `unauthenticated` status |
| `app/src/lib/firebase.ts` | Export phone auth utilities, remove `googleAuthEnabled` |
| `app/src/App.tsx` | Gate on auth state, render LoginScreen when unauthenticated |
| `app/src/screens/SettingsSheet.tsx` | Remove Google sign-in, show phone number |
| `app/src/styles.css` | Minimal login screen layout styles |
| `app/src/types.ts` | No changes needed |

## What Stays the Same

- Firestore security rules
- Data model (`users/{uid}` single-doc per user)
- `persist()` / `onSnapshot` sync logic
- All workout screens and components
