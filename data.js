// 80 Day Obsession Plan E meal data.
// Containers: G=green/veg, P=purple/fruit, R=red/protein, Y=yellow/carb,
// B=blue/healthy fats, O=orange/seeds&dressings, T=tsp/oils&nut butters.

const CONTAINER_TARGETS = { G: 7, P: 5, R: 7, Y: 5, B: 1, O: 1, T: 7 };

const CONTAINER_META = {
  G: { name: 'Vegetables',         short: 'Green',  color: '#22c55e' },
  P: { name: 'Fruits',             short: 'Purple', color: '#a855f7' },
  R: { name: 'Proteins',           short: 'Red',    color: '#ef4444' },
  Y: { name: 'Carbs',              short: 'Yellow', color: '#eab308' },
  B: { name: 'Healthy Fats',       short: 'Blue',   color: '#3b82f6' },
  O: { name: 'Seeds & Dressings',  short: 'Orange', color: '#f97316' },
  T: { name: 'Oils & Nut Butters', short: 'Tsp',    color: '#9ca3af' },
};

const CONTAINER_ORDER = ['G', 'P', 'R', 'Y', 'B', 'O', 'T'];

// Weekday (Mon-Sat) timeline. minutes = minutes since midnight (local).
const WEEKDAY_SLOTS = [
  { id: 'breakfast',   time: '7:00 AM',  minutes: 7 * 60,        label: 'Breakfast',     containers: { G: 1, P: 1, R: 1, Y: 1, T: 1 } },
  { id: 'midMorning',  time: '10:00 AM', minutes: 10 * 60,       label: 'Mid-Morning',   containers: { G: 2, P: 1, R: 1, Y: 1, B: 1, T: 1 } },
  { id: 'preWorkout',  time: '11:00 AM', minutes: 11 * 60,       label: 'Pre-Workout',   containers: { G: 1, P: 1, R: 1, Y: 1, T: 1 } },
  { id: 'workout',     time: '12:00 PM', minutes: 12 * 60,       label: 'WORKOUT',       containers: {}, isWorkout: true },
  { id: 'postWoShake', time: '1:30 PM',  minutes: 13 * 60 + 30,  label: 'Post-WO Shake', containers: { R: 1, Y: 1, T: 1 } },
  { id: 'postWoMeal',  time: '2:30 PM',  minutes: 14 * 60 + 30,  label: 'Post-WO Meal',  containers: { G: 2, R: 1, T: 1 } },
  { id: 'dinner',      time: '5:30 PM',  minutes: 17 * 60 + 30,  label: 'Dinner',        containers: { G: 1, P: 1, R: 1, Y: 1, O: 1, T: 1 } },
  { id: 'nightSnack',  time: '9:30 PM',  minutes: 21 * 60 + 30,  label: 'Night Snack',   containers: { R: 1, T: 1 } },
];

// Sunday rest day: 5 evenly-spaced meals, no workout, same daily container totals.
const SUNDAY_SLOTS = [
  { id: 'sunday1', time: '8:00 AM',  minutes: 8 * 60,        label: 'Meal 1', containers: { G: 1, P: 1, R: 1, Y: 1, T: 1 } },
  { id: 'sunday2', time: '11:00 AM', minutes: 11 * 60,       label: 'Meal 2', containers: { G: 2, P: 1, R: 1, Y: 1, B: 1, T: 2 } },
  { id: 'sunday3', time: '2:00 PM',  minutes: 14 * 60,       label: 'Meal 3', containers: { G: 1, P: 1, R: 1, Y: 1, T: 1 } },
  { id: 'sunday4', time: '5:30 PM',  minutes: 17 * 60 + 30,  label: 'Meal 4', containers: { G: 2, P: 1, R: 2, Y: 1, O: 1, T: 2 } },
  { id: 'sunday5', time: '8:30 PM',  minutes: 20 * 60 + 30,  label: 'Meal 5', containers: { G: 1, P: 1, R: 2, Y: 1, T: 1 } },
];

// Spec only specifies Week 1 breakfast / pre-workout. Weeks 2 & 3 reuse them.
const BREAKFAST = {
  A:   'Protein oatmeal + carrots',
  B:   'Egg whites (8) + oatmeal + kale sautéed in coconut oil',
  Sat: 'Scrambled eggs (2) + oatmeal + kale sautéed in olive oil',
};

const PRE_WORKOUT = {
  A: 'Turkey slices + apple + rice cakes + broccoli + almond butter',
  B: 'Greek yogurt w/ stevia + berries + raw veggies + rice cakes + almond butter',
};

const POST_WO_SHAKE = 'Protein shake (water) + rice cakes + almond butter';

const NIGHT_SNACK_AB = 'Cottage cheese (2%) + almond butter';
const NIGHT_SNACK_PB = 'Cottage cheese (2%) + peanut butter';

// dayIdx: 0=Mon..5=Sat. postWoMeals[0] is the Mon standalone, indices 1-5 derive from prior dinner.
const ROTATIONS = {
  1: {
    midMorning: {
      A: 'Greek chicken bowl: grilled chicken, mixed greens, cucumber, tomato, feta, quinoa, olive oil',
      B: 'Kale & Apple Salad: chicken breast, kale, apple, almonds, quinoa, olive oil dressing',
    },
    dinners: [
      'Sheet Pan Fajitas: chicken, peppers, onions, corn tortilla, pumpkin seeds, olive oil',
      'Chicken shawarma + mixed greens + roasted broccoli + olive oil w/ rice',
      'Salmon fillet + asparagus + mixed greens + olive oil + rice',
      'Grilled chicken thigh + roasted Brussels sprouts + zucchini + coconut oil + quinoa',
      'Teriyaki Chicken Bowl: chicken, broccoli, brown rice, edamame, sesame seeds, sesame oil',
      'Hibachi Chicken: chicken, broccoli, mushrooms, brown rice, pumpkin seeds, olive oil',
    ],
    postWoMeals: {
      0: 'Grilled chicken breast + steamed asparagus + olive oil',
      1: 'Fajita chicken w/ extra raw peppers + olive oil',
      2: 'Chicken shawarma + mixed greens + roasted broccoli + olive oil',
      3: 'Salmon fillet + asparagus + mixed greens + olive oil',
      4: 'Grilled chicken thigh + roasted Brussels sprouts + zucchini + coconut oil',
      5: 'Teriyaki chicken + broccoli + kale + sesame oil',
    },
  },
  2: {
    midMorning: {
      A: 'Chopped Salad: grilled chicken, romaine, cucumber, tomato, feta, quinoa, olive oil dressing',
      B: 'Bruschetta Chicken Salad: chicken, tomato, basil, spinach, arugula, almonds, quinoa, olive oil',
    },
    dinners: [
      'Korean Beef Bowl: lean ground beef, broccoli, carrots, brown rice, sesame seeds, sesame oil',
      'Ground Chicken Lettuce Wraps: ground chicken, lettuce cups, mushrooms, carrots, brown rice, sunflower seeds, sesame oil',
      'Stuffed Pepper Soup: lean ground beef, peppers, tomato, brown rice, pumpkin seeds, olive oil',
      'Pot Sticker Stir Fry: ground chicken, cabbage, mushrooms, brown rice, sunflower seeds, sesame oil',
      'Sweet Chili Chicken & Brussels Sprouts: chicken thigh, Brussels sprouts, brown rice, pumpkin seeds, olive oil',
      'Sausage Veggie Skillet: chicken sausage, peppers, zucchini, onions, brown rice, pumpkin seeds, olive oil',
    ],
    postWoMeals: {
      0: 'Grilled chicken breast + steamed asparagus + zucchini + olive oil',
      1: 'Korean beef + broccoli + carrots + sesame oil',
      2: 'Lettuce wrap filling: ground chicken + mushrooms + carrots + sesame oil',
      3: 'Stuffed pepper soup (no rice) + extra peppers + olive oil',
      4: 'Pot sticker stir fry filling: ground chicken + cabbage + mushrooms + sesame oil',
      5: 'Sweet chili chicken + Brussels sprouts + olive oil',
    },
  },
  3: {
    midMorning: {
      A: 'Thai Peanut Salad: chicken, cabbage, carrots, peppers, peanuts, edamame, sesame oil',
      B: 'Autumn Apple Salad: chicken, mixed greens, apple, pecans, quinoa, balsamic olive oil dressing',
    },
    dinners: [
      'Salsa Verde Chicken Bowl: chicken, peppers, tomato, black beans, pumpkin seeds, olive oil',
      'Chicken Pad Thai: chicken, bean sprouts, peppers, whole grain pasta, sunflower seeds, sesame oil',
      'Shrimp Fried Rice: shrimp, broccoli, carrots, brown rice, sesame seeds, sesame oil',
      'Egg Roll in a Bowl: ground chicken, cabbage, carrots, corn tortilla, pumpkin seeds, sesame oil',
      'Chicken Tortilla Soup: chicken, tomato, peppers, corn tortilla, pumpkin seeds, olive oil',
      'Caprese Chicken: chicken breast, tomato, mozzarella, spinach, quinoa, pumpkin seeds, olive oil',
    ],
    postWoMeals: {
      0: 'Grilled chicken breast + roasted cauliflower + spinach + olive oil',
      1: 'Salsa verde chicken + peppers + tomato + olive oil',
      2: 'Chicken pad thai filling: chicken + bean sprouts + peppers + sesame oil',
      3: 'Shrimp + broccoli + carrots + sesame oil',
      4: 'Egg roll bowl filling: ground chicken + cabbage + carrots + sesame oil',
      5: 'Chicken tortilla soup (no tortilla) + extra veggies + olive oil',
    },
  },
};

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function pickVariant(dayIdx) {
  // MWF (0,2,4) = A; TuTh (1,3) and Sat (5) = B. Sat breakfast is overridden separately.
  return (dayIdx === 0 || dayIdx === 2 || dayIdx === 4) ? 'A' : 'B';
}

function getSlotsForDay(dayIdx) {
  return dayIdx === 6 ? SUNDAY_SLOTS : WEEKDAY_SLOTS;
}

function getMealText(rotationWeek, dayIdx, slotId) {
  const rot = ROTATIONS[rotationWeek];
  switch (slotId) {
    case 'breakfast':   return dayIdx === 5 ? BREAKFAST.Sat : BREAKFAST[pickVariant(dayIdx)];
    case 'midMorning':  return rot.midMorning[pickVariant(dayIdx)];
    case 'preWorkout':  return PRE_WORKOUT[pickVariant(dayIdx)];
    case 'workout':     return '60 min training session';
    case 'postWoShake': return POST_WO_SHAKE;
    case 'postWoMeal':  return rot.postWoMeals[dayIdx] ?? '—';
    case 'dinner':      return rot.dinners[dayIdx] ?? '—';
    case 'nightSnack':  return dayIdx % 2 === 0 ? NIGHT_SNACK_AB : NIGHT_SNACK_PB;
    default:
      if (slotId.startsWith('sunday')) return 'Rest day — your call (stay within container budget)';
      return '';
  }
}
