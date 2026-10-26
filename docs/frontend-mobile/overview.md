# Frontend Mobile

The officer app is a **Flutter** app for patrol officers on the lake. It shows the alerts assigned to them and lets them record what they find.

## Technology

| Item | Choice |
|---|---|
| Framework | Flutter (Dart) |
| State management | Provider, with one view model per screen (MVVM) |
| Networking | `http` through a shared API client |
| Token storage | `flutter_secure_storage` (Keychain on iOS, Keystore on Android) |
| Target | Android first, iOS supported by Flutter |

## Features

| Feature | What it does |
|---|---|
| Sign in | Officers sign in with their email and password. Only patrol officers can use the app. |
| Home and navigation | A home screen with navigation to each part of the app. |
| Catch check form | Officers record the rig, the number of rig-nights and the catch weight for a catch check. |
| Assigned alerts | Officers see the alerts assigned to them, open one to read its details and the reason it was raised, and acknowledge it to confirm they are responding. |
| Inspection form | Officers record what they find at a site, including their GPS location and the outcome of the inspection. |
| Violation report form | Officers file a report when they find a violation. |
| Location | While responding to an alert, the app records the officer's location so reports are tied to where the check happened. |
| Offline save and sync | Records are saved on the phone when there is no signal and sent automatically when a connection returns. See [Offline Work](#offline-work). |

## Project Structure

```text
insyte-mobile/lib/
├── main.dart                         app start, providers
├── app/
│   └── routes.dart                   named routes
├── core/
│   ├── network/api_client.dart       base URL, token, JSON, errors
│   ├── storage/token_storage.dart    secure token storage
│   └── widgets/                      buttons, inputs, Vesper logo
└── features/
    ├── auth/                         sign in screen, view model, repository, user
    ├── home/                         home shell
    └── forms/                        catch check form, view model, model
```

Each feature follows the same pattern:

| Part | Job |
|---|---|
| Screen | Draws the UI and reacts to the view model |
| View model | Holds the screen's state, validates input, calls the repository |
| Repository | Talks to the API through `api_client.dart` |
| Model | The data the screen works with |

## Sign In Flow

1. The officer enters email and password.
2. The app calls `POST /vesper/auth/login`.
3. The returned token is saved with `flutter_secure_storage`, never in plain preferences.
4. The app loads the officer's profile and opens the home shell.
5. Signing out deletes the token.

Only patrol officers use the app. If a coordinator signs in, the app shows *"This app is for patrol officers. Coordinators sign in on the Vesper website."*

## Offline Work 

Signal is poor on much of the lake, so officers must be able to save records without a connection.

- Each record gets a unique `client_record_id` on the phone.
- Records are kept locally as **pending** until they are sent.
- When signal returns, pending records are sent in a batch.
- The server returns the existing record if a `client_record_id` was already accepted, so nothing is saved twice.
- Records that fail validation are kept apart from network failures, so they are not resent forever.
- Signing out clears protected local data on shared phones.

## Running Locally

```bash
flutter pub get
flutter run --dart-define=API_URL=http://10.0.2.2:8001/vesper
```

`10.0.2.2` reaches the computer's `localhost` from the Android emulator. On a real phone, use the computer's network address.
