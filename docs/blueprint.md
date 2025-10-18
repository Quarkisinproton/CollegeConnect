# **App Name**: Campus Connect

## Core Features:

- User Authentication: Enable user registration and login using Firebase Authentication with email/password and Google Sign-In.
- Events Dashboard: Display a list of all upcoming events fetched from Firestore, showing event name, date, and a brief description.
- Event Creation: Allow club presidents to create new events via a form. Include fields for event name, description, date, time, and location (captured via a Leaflet.js map).
- Event Details View: Show detailed information for each event, including name, description, date, time, and an interactive Leaflet.js map displaying the event's location.
- Live Navigation: Integrate the Geolocation API and a Leaflet routing plugin to calculate and display the route from the user's current location to the event's location on the map.

## Style Guidelines:

- Primary color: Royal blue (#4169E1), symbolizing knowledge and trust.
- Background color: Very light blue (#F0F9FF), providing a clean and calm backdrop.
- Accent color: Gold (#FFD700), standing out to signal important info.
- Body and headline font: 'Inter' sans-serif, suitable for both headlines and body text due to its modern and neutral appearance.
- Use clear, modern icons from a set like Material Icons for event categories, locations, and navigation.
- Use a clean, card-based layout for events on the dashboard and consistent spacing to create a professional, organized look.
- Incorporate smooth transitions and subtle animations for loading events and map interactions to enhance the user experience.