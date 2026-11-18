// Content for the grown-ups' corner. This is the only place in the game with text,
// because it is for parents, not children.

export interface Skill { title: string; body: string }
export interface TalkCard {
  /** The one idea this level is about, in plain words. */
  idea: string;
  /** Before pressing Go: questions that invite a guess. */
  before: string[];
  /** While it runs or right after: questions about what happened. */
  after: string[];
  /** Words worth using out loud during this level. */
  words: string[];
  /** A small, real-world follow-up with things around the house. */
  tryAtHome: string;
}

export const INTRO =
  'Tinker Table is a calm puzzle game for children aged about 4 to 7. Each level is a small machine with one piece missing. ' +
  'Your child adds parts, presses Go and watches what happens. Nothing ever "fails": if the machine misses, it simply resets, ' +
  'and they can change something and try again. The game works best with you sitting beside them, talking about what you both see.';

export const SKILLS: Skill[] = [
  { title: 'Cause and effect', body: '"If I do this, that happens." Every run shows a clear chain from what your child changed to what the machine did.' },
  { title: 'Guess, try, look, change', body: 'This is the heart of early science. Your child guesses what will happen, tries it, watches closely and changes one thing. You can make each step easy to notice by saying it out loud.' },
  { title: 'Space and angles', body: 'Higher and lower, steeper and flatter, closer and further, left and right. Placing a ramp is a hands-on lesson in all of them.' },
  { title: 'Planning in steps', body: 'The later levels need two or three things to happen in order. Talking through "first, then, then" builds the habit of planning ahead.' },
  { title: 'Sticking with it', body: 'There is no score, no timer and no fail screen. A miss is just information about what to try next. This is a gentle way to practise patience and trying again.' },
  { title: 'Words for how things move', body: 'Roll, slide, tip, bounce, float, push, heavy, light, fast, slow. Children learn these best when they see them happen and hear them named at the same moment.' },
  { title: 'Careful hands', body: 'Dragging a part to exactly the right spot and turning it with the arrow buttons is good practice for finger control and aiming.' },
];

export const ROUTINE: { step: string; say: string }[] = [
  { step: 'Look', say: '"What can you see? Where does the ball need to go?"' },
  { step: 'Guess', say: '"What do you think will happen when we press Go?" Make your own guess too, and get some wrong.' },
  { step: 'Go', say: 'Let your child press Go. Watch together. Use the snail button to see it again slowly.' },
  { step: 'Talk', say: '"What happened? Was it what you thought? What could we change?"' },
];

export const TIPS: string[] = [
  'Let your child hold the iPad and do the touching. Keep your hands in your lap unless they ask for help.',
  'Ask before you tell. A good question is better than the answer.',
  'When the machine misses, be curious, not corrective: "Ooh, where did it go? Why do you think that happened?"',
  'Encourage changing one thing at a time, so it\'s clear what made the difference.',
  'Praise the thinking and the trying ("You moved the ramp to see what happens, good idea!") rather than saying "clever".',
  'Stop while it\'s still fun. Ten to fifteen minutes is plenty. Finishing with the toy box is a nice way to wind down.',
  'At the end, ask your child to tell you how their machine worked. Explaining it is where a lot of the learning happens.',
];

export const TALK: Record<string, TalkCard> = {
  '01-roll': {
    idea: 'Things roll downhill. A slope sends the ball the way it leans, and a steeper slope makes it go faster.',
    before: ['Where will the ball go if we press Go now?', 'Which way should the ramp lean to send the ball to the basket?'],
    after: ['Was the ball fast or slow? Why?', 'What would happen if the ramp leaned the other way?'],
    words: ['roll', 'slope', 'downhill', 'steep', 'lean'],
    tryAtHome: 'Prop a book up on a cushion to make a ramp and roll a toy car down it. Make it steeper. Does the car go further?',
  },
  '02-dominoes': {
    idea: 'One small push can travel along a line, as each domino knocks over the next one. This is a chain reaction.',
    before: ['If the first domino falls, what happens to the next one?', 'What if the dominoes are too far apart?'],
    after: ['Who pushed the last domino? (Nobody did! The one before it did.)', 'Can you follow the push with your finger, from the start to the ball?'],
    words: ['chain', 'topple', 'knock', 'next', 'in a row'],
    tryAtHome: 'Stand up books, playing cards or building bricks in a row and topple the first one. Try them close together, then far apart.',
  },
  '03-seesaw': {
    idea: 'When something heavy lands on one end of a see-saw, the other end goes up and can throw what\'s sitting on it.',
    before: ['Which ball is heavier?', 'When the big ball lands on this end, what will the other end do?'],
    after: ['Why did the little ball fly up?', 'What if you dropped the big ball from lower down?'],
    words: ['heavy', 'light', 'up', 'down', 'balance', 'fling'],
    tryAtHome: 'Balance a ruler on a pencil and put a coin on one end. Tap the other end. On a playground see-saw, notice who goes up and who goes down.',
  },
  '04-balloon': {
    idea: 'Some things fall down, but a balloon floats up. To steer it you need a ceiling slide: a ramp it can slide along underneath.',
    before: ['Will the balloon go up or down? Is that the same as the ball?', 'How could a ramp help it get across to the star?'],
    after: ['Did the balloon slide along the ramp? Which way?', 'What would happen without the ramp?'],
    words: ['float', 'rise', 'up', 'underneath', 'slide'],
    tryAtHome: 'If you have a helium balloon, let it rise under a slanted tray or table edge and watch it slide along. Blowing bubbles shows floating too.',
  },
  '05-chain': {
    idea: 'Three things happen in order: the ball rolls, it bumps the fan, and the fan blows the balloon up. A machine is a chain of little steps.',
    before: ['What has to happen first? And then? And then?', 'How can we get the ball to the fan?'],
    after: ['Can you tell me the whole story of the machine, from the beginning?', 'Which step was the trickiest?'],
    words: ['first', 'then', 'next', 'last', 'blow', 'push'],
    tryAtHome: 'Build a two-step machine together: roll a ball down a ramp into a row of standing blocks. Ask your child to tell the steps before you start.',
  },
  '06-hamster': {
    idea: 'Something resting can be started by a bump. Once the hamster is awake, he keeps rolling by himself.',
    before: ['The hamster is asleep. How could we wake him up?', 'Where should the ball drop?'],
    after: ['What woke the hamster up?', 'Which way did he roll? Why do you think he went that way?'],
    words: ['bump', 'wake', 'start', 'drop', 'roll'],
    tryAtHome: 'Play "wake the sleeping toy": your child rolls a soft ball to touch a toy lying on the floor, and the toy then "wakes" and moves (you can be the motor!).',
  },
  '07-conveyor': {
    idea: 'A moving belt carries things along, and it can run either way. Turning it around changes where things go.',
    before: ['Which way are the belts moving? Look at the little arrows.', 'Which way do we need the ball to go?'],
    after: ['What happened when you turned the belt around?', 'Where have you seen moving belts? (A supermarket checkout, an airport.)'],
    words: ['carry', 'belt', 'left', 'right', 'turn around', 'direction'],
    tryAtHome: 'Next time you\'re at a supermarket checkout, watch the belt together. Which way does it go? What makes it stop?',
  },
  '08-wake-up': {
    idea: 'Putting ideas together: a rolling ball can be what wakes the hamster, and he does the rest of the journey.',
    before: ['How can we get the ball all the way over to the hamster?', 'What will the hamster do once he\'s awake?'],
    after: ['Tell me the story of the machine, from the ball to the cheese.', 'Which earlier level did this one remind you of?'],
    words: ['first', 'then', 'reach', 'shelf', 'roll off'],
    tryAtHome: 'Ask your child to invent a little machine story with toys ("the car pushes the teddy, the teddy falls on..."), then try to build it.',
  },
  toybox: {
    idea: 'Free play with every part and no goal. This is where children invent, test their own ideas and show you what they\'ve learned.',
    before: ['What would you like to make happen?', 'Can you build something that goes boing and then pop?'],
    after: ['Show me your machine. What does it do?', 'What would you add next?'],
    words: ['invent', 'build', 'try', 'what if'],
    tryAtHome: 'Draw your child\'s favourite machine together on paper, with arrows showing what moves where.',
  },
};
