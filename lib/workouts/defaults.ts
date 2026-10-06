// Your starting weekly plan. The first time you open the Workouts tab, this is
// copied into your account; after that you can edit the exercises in the app.
// Weekdays: 1 = Monday ... 7 = Sunday.

export type DayKind = "lift" | "cardio" | "rest";

export type DefaultExercise = {
  name: string;
  supersetWithNext?: boolean; // do the next exercise right after this one, no rest
};

export type DefaultDay = {
  weekday: number;
  kind: DayKind;
  title: string;
  exercises: DefaultExercise[];
};

// What a rest day is called everywhere in the app (it's shown for any day set to rest, even
// if an older copy of your plan still says "Rest Day").
export const REST_DAY_TITLE = "Recovery Day";

export const DEFAULT_PLAN: DefaultDay[] = [
  {
    weekday: 1,
    kind: "lift",
    title: "Chest & Back",
    exercises: [
      { name: "Pec deck", supersetWithNext: true },
      { name: "Incline press" },
      { name: "Pull downs (close grip, palms up)" },
      { name: "Deadlift" },
    ],
  },
  { weekday: 2, kind: "cardio", title: "Cardio", exercises: [] },
  {
    weekday: 3,
    kind: "lift",
    title: "Legs",
    exercises: [
      { name: "Leg extensions", supersetWithNext: true },
      { name: "Leg press" },
      { name: "Calf raises" },
    ],
  },
  { weekday: 4, kind: "cardio", title: "Cardio", exercises: [] },
  {
    weekday: 5,
    kind: "lift",
    title: "Delts & Arms",
    exercises: [
      { name: "Lateral raises (dumbbell)" },
      { name: "Reverse pec deck" },
      { name: "Curls (barbell)" },
      { name: "Tricep pressdown" },
      { name: "Dips" },
    ],
  },
  { weekday: 6, kind: "cardio", title: "Cardio", exercises: [] },
  { weekday: 7, kind: "rest", title: REST_DAY_TITLE, exercises: [] },
];
