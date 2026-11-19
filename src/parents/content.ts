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
  '09-bridge': {
    idea: 'A gap stops the ball, but a bridge gives it something to roll across. A bridge has to reach all the way from one side to the other.',
    before: ['What will happen when the ball gets to the gap?', 'How long does the bridge need to be? Where should it go?'],
    after: ['What did the bridge do for the ball?', 'What if the bridge was a bit too short, or tipped down?'],
    words: ['gap', 'bridge', 'across', 'fall', 'reach', 'level'],
    tryAtHome: 'Build a bridge between two piles of books with a ruler or a strip of card. Can a toy car get across? What happens if you pull the books further apart?',
  },
  '10-boing': {
    idea: 'Bouncy things push back. A spring under a falling ball throws it back up, high enough to jump over the wall.',
    before: ['Where does the ball land? Watch first, then put the spring there.', 'Can the ball get over the wall without help?'],
    after: ['What did the spring do when the ball landed on it?', 'Did it bounce higher or lower than you thought?'],
    words: ['bounce', 'boing', 'spring', 'over', 'high', 'land'],
    tryAtHome: 'Drop different balls on the floor: a bouncy ball, a tennis ball, a ball of socks. Which bounces highest? Try dropping them on a cushion too.',
  },
  '11-pop': {
    idea: 'A loud noise can start things too: the bang of the pop wakes the hamster. To pop the balloon, you have to guess where it will float and put the pin in its way.',
    before: ['How could we wake the hamster without touching him?', 'Where will the balloon go first? And then? Trace it with your finger.'],
    after: ['What woke the hamster up?', 'Is there another place the pin could go?'],
    words: ['float', 'path', 'sharp', 'pop', 'loud', 'wake'],
    tryAtHome: 'Roll a ball slowly across the floor and ask your child to put a cup where it will pass. Guessing where things will go is the game.',
  },
  '12-uphill': {
    idea: 'Ramps help things go down, but a gentle ramp also helps something go up. The hamster can\'t climb a wall, but he can climb a slope.',
    before: ['Can the hamster climb straight up the shelf?', 'Which way should the ramp lean to help him go up?'],
    after: ['Was it easier with a steep ramp or a gentle one?', 'Where do people use ramps to go up? (Prams, wheelchairs, lorries.)'],
    words: ['uphill', 'climb', 'gentle', 'steep', 'shelf'],
    tryAtHome: 'Push a toy car up a book ramp. Make the ramp steeper and steeper. When does it get too hard to push?',
  },
  '13-wind': {
    idea: 'Moving air pushes things. A fan blows the way it faces, so pointing it in the right direction matters as much as switching it on.',
    before: ['Which way will the fan blow?', 'How can we switch the fan on? (Something has to bump it.)'],
    after: ['What made the fan start?', 'What happened when the fan pointed the wrong way?'],
    words: ['wind', 'blow', 'push', 'point', 'direction', 'switch on'],
    tryAtHome: 'Blow a ping-pong ball or a scrunched-up paper ball across the table with a straw. Can your child steer it into a cup by changing where they blow?',
  },
  '14-lift': {
    idea: 'A pulley joins two things with a rope. When one side gets heavier and goes down, the other side goes up.',
    before: ['What happens to the bucket when the ball falls in?', 'If the bucket goes down, which way does the other side go?'],
    after: ['Why did the weight go up?', 'Where have you seen a pulley or a lift? (Flagpoles, cranes, a well.)'],
    words: ['pulley', 'rope', 'heavy', 'down', 'up', 'lift', 'stop'],
    tryAtHome: 'Hang a string over a door handle or a chair back with a small bag on each end. Put a toy in one bag and watch the other bag rise.',
  },
  '15-bank-shot': {
    idea: 'A ball that hits a wall bounces back the other way. A springy wall sends it back with plenty of speed, like a ball off a cushion in snooker.',
    before: ['Where does the ball go if nothing stops it?', 'How could we make it come back towards the basket?'],
    after: ['Which way did the ball go after it hit the spring?', 'What happened when the spring was tilted a bit?'],
    words: ['bounce back', 'wall', 'angle', 'tilt', 'opposite way'],
    tryAtHome: 'Roll a ball at a wall, straight on and then at a slant. Where does it come back to? Try to bounce it into a box.',
  },
  '16-pusher': {
    idea: 'Something moving can push something else along. Here your child places the hamster and decides which way he faces, so he becomes the machine\'s motor.',
    before: ['What will wake the hamster up?', 'Which way does he need to face to push the ball?'],
    after: ['What did the hamster do to the ball?', 'What happened when he faced the other way?'],
    words: ['push', 'motor', 'face', 'direction', 'off the edge'],
    tryAtHome: 'Push a toy car into a lighter toy on a table. What happens to the lighter one? What if you push gently, or harder?',
  },
  '17-safe-balloon': {
    idea: 'Sometimes the job is keeping something safe. One ramp is too short to get past the pins, so your child has to join two ramps into one path.',
    before: ['What happens if the balloon floats straight up?', 'Where does the first ramp end? Where should the next one start?'],
    after: ['Can you follow the balloon\'s path with your finger?', 'Why did we need two ramps, not one?'],
    words: ['danger', 'safe', 'path', 'join', 'along', 'under'],
    tryAtHome: 'Make a marble run from rolled-up card or toilet-roll tubes taped to a wall or a box. Joining the pieces so the marble doesn\'t fall out is the same puzzle.',
  },
  '18-belt-boing': {
    idea: 'Two parts working as a team. The belt gets the ball moving, and the spring sends it up. Neither one can do the job alone.',
    before: ['What does the belt do? What does the spring do?', 'Which one comes first?'],
    after: ['What would happen with only the spring? Only the belt?', 'Where did the ball land on the spring?'],
    words: ['team', 'first', 'then', 'carry', 'bounce', 'together'],
    tryAtHome: 'Play "relay": your child rolls a ball to you and you throw it into a basket. Then swap jobs. Each of you does one part of the job.',
  },
  '19-big-machine': {
    idea: 'The biggest machine so far, with three parts in a chain: belt, then fan, then ramp. Each step only works if the one before it does.',
    before: ['Tell me the plan: what happens first, then next, then last?', 'Which part could we put in first?'],
    after: ['Which step went wrong, and how did you fix it?', 'Tell me the whole story of the machine from the ball to the star.'],
    words: ['machine', 'chain', 'step', 'plan', 'first', 'last'],
    tryAtHome: 'Draw a crazy machine together on a big sheet of paper: a ball, a slide, a fan, a cat... Ask your child to tell you what each part does, in order.',
  },
  '20-goes-up': {
    idea: 'Choosing the right tool. A ball falls down, but a balloon floats up, and only something going up can reach the fan under the ceiling.',
    before: ['Which way does the ball go when you let go? And the balloon?', 'What could reach all the way up to the fan?'],
    after: ['Why couldn\'t the ball do it?', 'What happened to the balloon when it went under the slanted plank?'],
    words: ['up', 'down', 'float', 'fall', 'choose', 'high'],
    tryAtHome: 'Gather a few things (a feather, a coin, a balloon, a bubble) and guess together: will it go up, float down slowly, or drop fast? Then test.',
  },
  '21-hold-down': {
    idea: 'Air can push in any direction. Here the wind pushes down, harder than the balloon pulls up, so it stays in the basket.',
    before: ['What will the balloon do if we don\'t help?', 'Which way should the fan blow?'],
    after: ['Why did the balloon stay in the basket?', 'What happened when the fan was too far away?'],
    words: ['push', 'down', 'hold', 'strong', 'float away'],
    tryAtHome: 'Blow up at a feather or a scrap of tissue to keep it in the air, then blow down on it to push it onto the table.',
  },
  '22-catapult': {
    idea: 'Your child builds the catapult. The see-saw has to go where both balls land, with its middle between them.',
    before: ['Where will each ball fall? Point to where they will land.', 'Where should the middle of the see-saw go?'],
    after: ['What did the heavy ball do to the little ball?', 'What if the see-saw was further to one side?'],
    words: ['middle', 'between', 'fling', 'catapult', 'land'],
    tryAtHome: 'Make a spoon catapult: balance a spoon on a pencil with a pom-pom or paper ball in the bowl, and tap the handle.',
  },
  '23-domino-switch': {
    idea: 'A chain reaction can switch something on. The dominoes carry the push along the shelf to the fan, and the fan does the next job.',
    before: ['What does the fan need to start blowing?', 'How far apart can the dominoes be?'],
    after: ['What did the last domino do?', 'Can you tell me the steps: dominoes, then...?'],
    words: ['switch on', 'chain', 'next', 'gap', 'start'],
    tryAtHome: 'Set up a row of dominoes or books that ends by knocking a toy off the table edge into a box.',
  },
  '24-under-belt': {
    idea: 'Underneath, a belt moves the opposite way to its top, just like a real conveyor belt loop. So the belts have to be turned around.',
    before: ['Look at the arrows. Which way will the balloon go under this belt?', 'How many belts do we need to get past all the pins?'],
    after: ['Which way did the balloon go? Was it the way the arrows pointed?', 'Why does the bottom of a belt go the other way?'],
    words: ['underneath', 'opposite', 'turn around', 'loop', 'carry'],
    tryAtHome: 'Make a loop from a strip of paper around two pencils. Pull the top towards you and watch which way the bottom goes.',
  },
  '25-ski-jump': {
    idea: 'Going fast and then pointing upwards makes things jump. A ramp gives speed, and a little upturn at the end lifts the ball over the wall.',
    before: ['Can the ball get over the wall by rolling?', 'What does a ski jump look like at the end?'],
    after: ['What happened when the end of the jump pointed down? Up?', 'Did a steeper ramp make it jump further?'],
    words: ['speed', 'jump', 'launch', 'steep', 'over', 'land'],
    tryAtHome: 'Make a ramp from a book with a small upturned card at the end, and jump a toy car over a pencil. Move the pencil further away each time.',
  },
  '26-pop-motor': {
    idea: 'A three-step machine with two of your child\'s own parts: the pin pops the balloon, the bang wakes the hamster, and the hamster pushes the ball.',
    before: ['What wakes the hamster in this level?', 'Where should the hamster go, and which way should he face?'],
    after: ['Tell me the story: pop, then...?', 'What happened when the hamster faced the wrong way?'],
    words: ['pop', 'wake', 'push', 'first', 'then', 'last'],
    tryAtHome: 'Play "sleeping lions": one person sleeps and wakes up only at a loud clap, then has to fetch a toy.',
  },
  '27-domino-stairs': {
    idea: 'A chain can climb. Each domino is placed a step higher, close enough to be knocked by the one below. Spacing matters a lot.',
    before: ['How close do the dominoes need to be?', 'Can a domino knock over one that stands higher up?'],
    after: ['Where did the chain stop? Why there?', 'How many dominoes did we need?'],
    words: ['stairs', 'step', 'higher', 'close', 'spacing', 'climb'],
    tryAtHome: 'Make stairs out of books and stand dominoes or playing cards on each step. Can the chain go up? Can it go down?',
  },
  '28-hopscotch': {
    idea: 'Two springs in a row, one for each hole. The bounce from the first spring has to set the ball up for the second.',
    before: ['What happens when the ball reaches the first hole?', 'Where should each spring go?'],
    after: ['Which hole was trickier? Why?', 'What did the ball do between the two holes?'],
    words: ['hole', 'bounce', 'hop', 'over', 'twice', 'land'],
    tryAtHome: 'Play hopscotch together, then roll a ball along a corridor with "holes" (paper squares) it must not stop on.',
  },
  '29-catch-carry': {
    idea: 'One part throws, another catches. The see-saw flings the ball high, and the belt catches it in the air and carries it into the basket.',
    before: ['Where will the little ball fly? Point to the top of its path.', 'Which way should the belt carry it?'],
    after: ['Where did the ball land on the belt?', 'What happened when the belt was lower or higher?'],
    words: ['throw', 'catch', 'carry', 'high', 'path', 'land'],
    tryAtHome: 'Play throw-and-catch with a soft ball, then catch it in a bucket instead of your hands. Where do you need to hold the bucket?',
  },
  '30-grand-finale': {
    idea: 'The biggest machine: dominoes switch on the fan, the fan blows the balloon, the pin pops it, the bang wakes the hamster, and a ramp gets him up to the cheese.',
    before: ['Let\'s plan it together. What happens first?', 'Which part could we place first to test it?'],
    after: ['Tell me the whole story from the dominoes to the cheese.', 'Which part was the hardest to get right?'],
    words: ['machine', 'plan', 'step', 'chain', 'test', 'fix'],
    tryAtHome: 'Build a real chain-reaction machine with toys: a car down a ramp into dominoes into a ball into a cup. It\'s fine if it takes many tries.',
  },
  '34-hammer': {
    idea: 'A new part: the hammer stands still until something bumps it, then swings down hard. A small bump starts a big hit: one thing sets off the next.',
    before: ['What will make the hammer swing?', 'Which ball will the hammer hit?'],
    after: ['What bumped the hammer?', 'What did the hammer do to the ball?'],
    words: ['bump', 'swing', 'whack', 'start', 'hit'],
    tryAtHome: 'Stand a ruler up on its end and gently tap the top. Which way does it fall? Can you make it knock over a paper cup?',
  },
  '35-hammer-face': {
    idea: 'The hammer swings the way it faces, so your child has to plan two things: where the rolling ball will bump it, and which way it should swing.',
    before: ['Where will the rolling ball go?', 'Which way should the hammer swing to hit the other ball?'],
    after: ['What happened when the hammer faced the other way?', 'Where else could the hammer go?'],
    words: ['facing', 'left', 'right', 'in the way', 'plan'],
    tryAtHome: 'Roll a ball across the floor and ask your child to put a toy where the ball will bump it. Then try it from the other side.',
  },
  '36-hammer-dominoes': {
    idea: 'A chain reaction: dominoes fall one after another, the last one bumps the hammer, and the hammer whacks the ball. Each step has to reach the next one.',
    before: ['How far apart should the dominoes stand?', 'Will the last domino reach the hammer?'],
    after: ['Tell me the story: first the domino... then...?', 'What happened when there was a gap?'],
    words: ['chain', 'one after another', 'gap', 'reach', 'next'],
    tryAtHome: 'Line up books or blocks on the floor and knock over the first one. How far apart can they be and still all fall?',
  },
  '40-watering-can': {
    idea: 'New parts: the watering can and a thirsty flower. Bump the can and it tips and pours; the flower drinks the water and opens up. Plants need water to grow.',
    before: ['What does the flower need?', 'How can we tip the watering can over?'],
    after: ['What happened to the flower when it got water?', 'Where did the water go?'],
    words: ['water', 'pour', 'tip', 'thirsty', 'grow', 'bloom'],
    tryAtHome: 'Water a real plant together. Watch where the water goes: does it soak in, or run off?',
  },
  '41-water-path': {
    idea: 'Water always runs downhill. To get it somewhere, you build a path that keeps going down, with each part joining the next, like a gutter or a slide.',
    before: ['Which way does water run?', 'Where does the water fall off the first ramp?'],
    after: ['What happened when the ramps didn\'t join up?', 'Why did the water stop on a flat ramp?'],
    words: ['downhill', 'path', 'flow', 'join up', 'drip'],
    tryAtHome: 'In the bath or the garden, pour water down a tilted tray or a piece of guttering. Can you make it reach a cup?',
  },
  '42-water-wake': {
    idea: 'Water can be a trigger too: a splash wakes the hamster. Your child decides where the can goes and which way its spout points.',
    before: ['How could we wake the hamster without touching him?', 'Which way should the spout point?'],
    after: ['What woke the hamster up?', 'What happened when the spout pointed the other way?'],
    words: ['splash', 'spout', 'point', 'wake up', 'aim'],
    tryAtHome: 'With a cup of water outside, try to pour it onto a leaf on the ground. Do you pour from high up or low down?',
  },
  '37-toaster': {
    idea: 'A new part: the toaster. Something dropped into it pops back up, a little to one side. Your child has to guess where the ball will fall, and then where it will go after the pop.',
    before: ['Where will the ball fall?', 'Where will it go after the toaster pops it up?'],
    after: ['What did the toaster do?', 'What happened when the toaster faced the other way?'],
    words: ['drop', 'pop up', 'catch', 'ding', 'side'],
    tryAtHome: 'Toss a soft ball straight up and catch it. Then toss it up and a little forward: where do you need to stand to catch it?',
  },
  '38-toaster-wall': {
    idea: 'Going up and over: a wall blocks the way, so the ball has to go up before it can go across. The toaster faces the way the ball needs to go.',
    before: ['Can the ball get through the wall?', 'Which way should the toaster face?'],
    after: ['How did the ball get over the wall?', 'What happened when the toaster faced the belt?'],
    words: ['over', 'wall', 'up and across', 'facing', 'drop off'],
    tryAtHome: 'Build a little wall of books and throw a ball over it into a box. Do you throw it straight or up high?',
  },
  '39-toaster-hamster': {
    idea: 'A three-step story: a ball wakes the hamster, he rolls off his shelf, and the toaster pops him up to the cheese. The toaster can lift anything that fits, not just balls.',
    before: ['How can we wake the hamster?', 'Where will he fall when he rolls off the shelf?'],
    after: ['Tell me the story: first... then... then...?', 'What else could the toaster pop up?'],
    words: ['wake up', 'roll off', 'catch', 'lift', 'story'],
    tryAtHome: 'Roll a toy off the edge of a table into a box on the floor. Move the box until you catch it every time.',
  },
  '31-car-push': {
    idea: 'A new part: the toy car has its own motor. It starts as soon as you press go and drives the way it faces, pushing whatever is in front of it.',
    before: ['Where should the car start, so it bumps the ball?', 'Which way is the car facing? Tap it to turn it around.'],
    after: ['What did the car do to the ball?', 'What happens if the car faces the other way?'],
    words: ['motor', 'drive', 'push', 'facing', 'by itself'],
    tryAtHome: 'Wind up or push a toy car towards a ball on the floor. Can you aim it so the ball rolls into a box?',
  },
  '32-car-ride': {
    idea: 'A ball can\'t roll uphill on its own, but something with a motor can carry it up. Your child builds a road, and the road has to join up with no gaps.',
    before: ['Can the ball get up to the star by itself?', 'Where does the road need to start and end?'],
    after: ['How did the ball get up there?', 'What happened when there was a gap in the road?'],
    words: ['carry', 'uphill', 'road', 'join up', 'gap'],
    tryAtHome: 'Put a small toy on a toy truck and drive it up a book ramp. What happens if the ramp is very steep?',
  },
  '33-car-catapult': {
    idea: 'A strong motor can move something heavy. The car pushes the heavy ball, the heavy ball drops on the see-saw, and the see-saw flings the little ball: three steps, one after another.',
    before: ['Which ball is heavy, and which is light?', 'Where will the heavy ball fall when the car pushes it off?'],
    after: ['Tell me the story: first the car... then...?', 'Why does the heavy ball fling the little one so high?'],
    words: ['heavy', 'light', 'push', 'fling', 'one after another'],
    tryAtHome: 'Make a see-saw with a ruler over a pencil. Put a coin on one end and tap the other end hard. Where does the coin go?',
  },
  toybox: {
    idea: 'Free play with every part and no goal. This is where children invent, test their own ideas and show you what they\'ve learned.',
    before: ['What would you like to make happen?', 'Can you build something that goes boing and then pop?'],
    after: ['Show me your machine. What does it do?', 'What would you add next?'],
    words: ['invent', 'build', 'try', 'what if'],
    tryAtHome: 'Draw your child\'s favourite machine together on paper, with arrows showing what moves where.',
  },
};

/** How to make a puzzle, for grown-ups (the toy box itself has no words). */
export const MAKER_HOW =
  'In the toy box, build a machine that works, then tap the button with the star. Tap the thing that travels (a ball, balloon, hamster, pulley or car), ' +
  'then where it should go (a basket, star or cheese). For a watering can, tap the can and then a flower: the goal is to water it. Tap any other parts that should stay put: they get a brass pin. Everything without a pin goes into the tray ' +
  'for the solver. Tap the tick: the game checks the machine works, and that it does not work without the tray parts. Good puzzles appear in the toy box room. ' +
  'Try swapping roles: you make one for your child, then they make one for you.';

export const MADE_TALK = {
  idea: 'Ask the maker how the machine is meant to work before anyone tries it. Explaining their own puzzle is great practice in planning and describing steps.',
  none: 'No puzzles made yet. They appear here once one is saved from the toy box.',
};
