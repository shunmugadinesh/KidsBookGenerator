import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sparkles, BookOpen, Download, AlertCircle, Loader2, XCircle } from 'lucide-react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

// The user's complete A-Z prompt dictionary
const BOOK_PROMPTS = {
  "A": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\njoyfully holding a giant shiny red apple with both hands, smiling at it, apple has a golden glow around it, apple is oversized and cartoonishly perfect.\n\nLetter \"A\" for Apple. Centered full-body or 3/4 body composition, clean soft pastel background with subtle apple-themed color wash, single large glowing letter \"A\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Apple\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "B": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nlaughing with delight as a large magical rainbow-coloured butterfly lands gently on their nose, surrounded by 2–3 more fluttering butterflies nearby.\n\nLetter \"B\" for Butterfly. Centered full-body or 3/4 body composition, clean soft pastel background with subtle butterfly-themed color wash, single large glowing letter \"B\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Butterfly\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "C": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nsitting cross-legged on the floor, cuddling a fluffy cartoon orange cat in their lap, both looking happy and cozy, soft warm living-room light.\n\nLetter \"C\" for Cat. Centered full-body or 3/4 body composition, clean soft pastel background with subtle cat-themed color wash, single large glowing letter \"C\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Cat\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "D": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\ncrouching down by a tiny pond puddle, hand outstretched, as a cheerful yellow cartoon duck waddles toward them, water rippling softly.\n\nLetter \"D\" for Duck. Centered full-body or 3/4 body composition, clean soft pastel background with subtle duck-themed color wash, single large glowing letter \"D\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Duck\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "E": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nlaughing as a tiny baby cartoon elephant wraps its small trunk around their arm in a playful hug, elephant is soft grey with big floppy ears.\n\nLetter \"E\" for Elephant. Centered full-body or 3/4 body composition, clean soft pastel background with subtle elephant-themed color wash, single large glowing letter \"E\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Elephant\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "F": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nwide-eyed and excited, holding up a round fishbowl with a single bright orange fish inside, fish and child both making funny surprised faces at each other.\n\nLetter \"F\" for Fish. Centered full-body or 3/4 body composition, clean soft pastel background with subtle fish-themed color wash, single large glowing letter \"F\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Fish\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "G": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nstanding next to a tiny cute cartoon giraffe, stretching up on tiptoes trying to reach the giraffe's neck for a hug, both looking adorable.\n\nLetter \"G\" for Giraffe. Centered full-body or 3/4 body composition, clean soft pastel background with subtle giraffe-themed color wash, single large glowing letter \"G\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Giraffe\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "H": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nwearing a comically oversized magical wizard hat covered in stars and moons, hat slightly tilted, arms out for balance, giggling expression.\n\nLetter \"H\" for Hat. Centered full-body or 3/4 body composition, clean soft pastel background with subtle hat-themed color wash, single large glowing letter \"H\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Hat\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "I": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nholding a towering 3-scoop cartoon ice cream cone with colorful scoops (strawberry, vanilla, chocolate), a tiny bit dripping, eyes wide with joy.\n\nLetter \"I\" for Ice cream. Centered full-body or 3/4 body composition, clean soft pastel background with subtle ice cream-themed color wash, single large glowing letter \"I\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Ice cream\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "J": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\peeking curiously into a glowing mason jar full of tiny fireflies, soft golden light illuminating their face with wonder, both hands around the jar.\n\nLetter \"J\" for Jar. Centered full-body or 3/4 body composition, clean soft pastel background with subtle jar-themed color wash, single large glowing letter \"J\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Jar\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "K": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nrunning joyfully with a large diamond-shaped kite soaring high above, string in both hands, hair and clothes blowing in breeze, blue sky behind.\n\nLetter \"K\" for Kite. Centered full-body or 3/4 body composition, clean soft pastel background with subtle kite-themed color wash, single large glowing letter \"K\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Kite\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "L": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nmaking the funniest sour face after biting into a bright cartoon lemon, eyes scrunched, shoulders raised, lemon held dramatically in one hand.\n\nLetter \"L\" for Lemon. Centered full-body or 3/4 body composition, clean soft pastel background with subtle lemon-themed color wash, single large glowing letter \"L\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Lemon\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "M": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nlying on their back in soft grass, reaching up both arms toward a giant glowing cartoon moon in a starry purple night sky, looking magical and peaceful.\n\nLetter \"M\" for Moon. Centered full-body or 3/4 body composition, clean soft pastel background with subtle moon-themed color wash, single large glowing letter \"M\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Moon\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "N": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\ngently and carefully holding a small cozy bird nest with two tiny eggs inside, kneeling down, expression of gentle wonder and care.\n\nLetter \"N\" for Nest. Centered full-body or 3/4 body composition, clean soft pastel background with subtle nest-themed color wash, single large glowing letter \"N\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Nest\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "O": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\npeeling a large cartoon orange, spiral peel coming off in one piece, citrus mist in the air, bright and zesty expression, juice slightly spraying.\n\nLetter \"O\" for Orange. Centered full-body or 3/4 body composition, clean soft pastel background with subtle orange-themed color wash, single large glowing letter \"O\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Orange\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "P": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nseated at a small colourful desk, drawing enthusiastically with a giant oversized magic pencil, sparkling colourful art appearing on the paper in front of them.\n\nLetter \"P\" for Pencil. Centered full-body or 3/4 body composition, clean soft pastel background with subtle pencil-themed color wash, single large glowing letter \"P\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Pencil\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "Q": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nproudly wearing a sparkly cartoon crown and a little royal cape, holding a sceptre, standing regally but with a big playful grin, looking adorable not scary.\n\nLetter \"Q\" for Queen. Centered full-body or 3/4 body composition, clean soft pastel background with subtle queen-themed color wash, single large glowing letter \"Q\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Queen\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "R": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\narms spread wide in delight, standing under a giant vivid rainbow that arcs across the whole background, soft sunlight and a few white fluffy clouds.\n\nLetter \"R\" for Rainbow. Centered full-body or 3/4 body composition, clean soft pastel background with subtle rainbow-themed color wash, single large glowing letter \"R\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Rainbow\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "S": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nholding a large glowing golden 5-pointed star with both hands above their head, star casting warm sparkly light on their face, night sky full of small stars behind.\n\nLetter \"S\" for Star. Centered full-body or 3/4 body composition, clean soft pastel background with subtle star-themed color wash, single large glowing letter \"S\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Star\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "T": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nsitting contentedly in the low wide branch of a friendly cartoon tree, legs dangling, one hand patting the tree trunk, surrounded by green leaves and a butterfly.\n\nLetter \"T\" for Tree. Centered full-body or 3/4 body composition, clean soft pastel background with subtle tree-themed color wash, single large glowing letter \"T\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Tree\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "U": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nstanding under a large colourful polka-dot umbrella, happy and dry while cartoon raindrops fall gently around them, puddles on the ground reflecting colours.\n\nLetter \"U\" for Umbrella. Centered full-body or 3/4 body composition, clean soft pastel background with subtle umbrella-themed color wash, single large glowing letter \"U\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Umbrella\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "V": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nstanding proudly holding a small cartoon violin under their chin, bow in hand, musical notes floating out in swirling colourful trails, joyful performance face.\n\nLetter \"V\" for Violin. Centered full-body or 3/4 body composition, clean soft pastel background with subtle violin-themed color wash, single large glowing letter \"V\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Violin\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "W": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nsitting on the ground happily eating a huge cartoon watermelon slice, juice on cheeks, seeds flying out comically, summery joyful expression.\n\nLetter \"W\" for Watermelon. Centered full-body or 3/4 body composition, clean soft pastel background with subtle watermelon-themed color wash, single large glowing letter \"W\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Watermelon\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "X": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nkneeling on the floor banging a bright rainbow-coloured cartoon xylophone with two mallets, musical notes bouncing everywhere, huge smile of musical fun.\n\nLetter \"X\" for Xylophone. Centered full-body or 3/4 body composition, clean soft pastel background with subtle xylophone-themed color wash, single large glowing letter \"X\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Xylophone\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "Y": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nsitting surrounded by colourful balls of yarn, playfully tangled in a loop of soft yarn, laughing, with a tiny cartoon kitten also tangled beside them.\n\nLetter \"Y\" for Yarn. Centered full-body or 3/4 body composition, clean soft pastel background with subtle yarn-themed color wash, single large glowing letter \"Y\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Yarn\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
  "Z": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\nlaughing and hugging the striped neck of a friendly small cartoon zebra, zebra has big kind eyes and one ear flicked forward curiously, both looking happy.\n\nLetter \"Z\" for Zebra. Centered full-body or 3/4 body composition, clean soft pastel background with subtle zebra-themed color wash, single large glowing letter \"Z\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Zebra\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted"
};

const LETTERS = Object.keys(BOOK_PROMPTS);

export default function App() {
  const [referenceImage, setReferenceImage] = useState(null);
  const [appMode, setAppMode] = useState('book'); // 'book' or 'habit'

  // Model Selectors (Common)
  const [selectedModel, setSelectedModel] = useState('pollinations');
  const [habitTextModel, setHabitTextModel] = useState('ollama');

  // Unified Error and Progress states
  const [error, setError] = useState(null);
  const [allProgress, setAllProgress] = useState('');
  const fileInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Alphabet Book Module States
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [generatedImages, setGeneratedImages] = useState({});
  const [modelUsed, setModelUsed] = useState({});
  const [editablePrompt, setEditablePrompt] = useState('');
  const [generatingAll, setGeneratingAll] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Automatically parsed story lines for Alphabet Book
  const [bookStories, setBookStories] = useState(() => {
    const stories = {};
    Object.keys(BOOK_PROMPTS).forEach(letter => {
      const labelMatch = BOOK_PROMPTS[letter].match(/Letter "[A-Z]" for ([A-Za-z\s]+)\./i);
      const label = labelMatch ? labelMatch[1] : letter;
      stories[letter] = `${letter} is for ${label}. Rithvin is happy playing!`;
    });
    return stories;
  });

  // Custom book prompts (so user edits to letters persist)
  const [customBookPrompts, setCustomBookPrompts] = useState({ ...BOOK_PROMPTS });

  // Habit Chart Module States
  const [habitTitle, setHabitTitle] = useState('Potty Training');
  const [habitTotalScenes, setHabitTotalScenes] = useState(4);
  const [habitTotalPages, setHabitTotalPages] = useState(4);
  const [habitPrompts, setHabitPrompts] = useState({});
  const [selectedHabitPage, setSelectedHabitPage] = useState('Page 1');
  const [habitGeneratedImages, setHabitGeneratedImages] = useState({});
  const [habitModelUsed, setHabitModelUsed] = useState({});
  const [habitStoryTexts, setHabitStoryTexts] = useState({});
  const [habitEditablePrompt, setHabitEditablePrompt] = useState('');
  const [isGeneratingHabitPlan, setIsGeneratingHabitPlan] = useState(false);
  const [isGeneratingHabitImage, setIsGeneratingHabitImage] = useState(false);
  const [generatingAllHabits, setGeneratingAllHabits] = useState(false);
  const [habitPlanProgress, setHabitPlanProgress] = useState({ done: 0, total: 0 });

  const MODEL_LABELS = {
    pollinations: 'Pollinations AI',
    gemini: 'Gemini Flash Image',
    huggingface: 'HuggingFace FLUX'
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReferenceImage(reader.result);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const isBook = appMode === 'book';

  // Active Key (e.g. "A" or "Page 1")
  const activePageKey = isBook ? selectedLetter : selectedHabitPage;

  // Active Maps
  const activeGeneratedImages = isBook ? generatedImages : habitGeneratedImages;
  const activeModelUsed = isBook ? modelUsed : habitModelUsed;
  const activeStories = isBook ? bookStories : habitStoryTexts;

  // Active Prompt and prompt editor sync
  const activePromptText = isBook ? editablePrompt : habitEditablePrompt;

  // Unified page list
  const pagesList = isBook ? LETTERS : Object.keys(habitPrompts).sort((a, b) => {
    const numA = parseInt(a.split(' ')[1]) || 0;
    const numB = parseInt(b.split(' ')[1]) || 0;
    return numA - numB;
  });

  // Active generating indicators
  const isGeneratingActiveImage = isBook ? isGenerating : isGeneratingHabitImage;
  const isGeneratingAllActive = isBook ? generatingAll : generatingAllHabits;

  // Automatically load page prompt whenever page, mode, or dynamic prompts change
  useEffect(() => {
    if (isBook) {
      setEditablePrompt(customBookPrompts[selectedLetter] || '');
    } else {
      const pageData = habitPrompts[selectedHabitPage];
      const p = typeof pageData === 'object' ? pageData.prompt : pageData;
      setHabitEditablePrompt(p || '');
    }
  }, [selectedLetter, selectedHabitPage, appMode, customBookPrompts, habitPrompts]);

  const handlePromptChange = (val) => {
    if (isBook) {
      setEditablePrompt(val);
      setCustomBookPrompts(prev => ({ ...prev, [selectedLetter]: val }));
    } else {
      setHabitEditablePrompt(val);
      setHabitPrompts(prev => {
        const pageData = prev[selectedHabitPage];
        if (typeof pageData === 'object') {
          return { ...prev, [selectedHabitPage]: { ...pageData, prompt: val } };
        }
        return { ...prev, [selectedHabitPage]: val };
      });
    }
  };

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleGenerateImage = async (pageKey = activePageKey, promptText = activePromptText, signal = null) => {
    const isGeneratingSetter = isBook ? setIsGenerating : setIsGeneratingHabitImage;
    isGeneratingSetter(true);
    setError(null);

    if (!signal) {
      if (abortControllerRef.current) abortControllerRef.current.abort();
      abortControllerRef.current = new AbortController();
      signal = abortControllerRef.current.signal;
    }

    try {
      const response = await fetch('/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          image: referenceImage,
          model: selectedModel
        }),
        signal
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Generation failed");

      if (isBook) {
        setGeneratedImages(prev => ({ ...prev, [pageKey]: data.image }));
        setModelUsed(prev => ({ ...prev, [pageKey]: selectedModel }));
      } else {
        setHabitGeneratedImages(prev => ({ ...prev, [pageKey]: data.image }));
        setHabitModelUsed(prev => ({ ...prev, [pageKey]: selectedModel }));
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setError(`Failed to generate image for ${pageKey}. ${err.message}`);
    } finally {
      isGeneratingSetter(false);
    }
  };

  const handleGenerateAll = async () => {
    const isGeneratingAllSetter = isBook ? setGeneratingAll : setGeneratingAllHabits;
    isGeneratingAllSetter(true);
    setError(null);

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    for (let i = 0; i < pagesList.length; i++) {
      if (signal.aborted) break;
      const pageKey = pagesList[i];
      setAllProgress(`Generating ${pageKey} (${i + 1}/${pagesList.length})...`);

      if (isBook) {
        setSelectedLetter(pageKey);
      } else {
        setSelectedHabitPage(pageKey);
      }

      const promptToUse = isBook
        ? customBookPrompts[pageKey]
        : (typeof habitPrompts[pageKey] === 'object' ? habitPrompts[pageKey].prompt : habitPrompts[pageKey]);

      try {
        await handleGenerateImage(pageKey, promptToUse, signal);
      } catch (err) {
        if (err.name === 'AbortError') break;
        console.error(`Failed bulk generation for ${pageKey}:`, err);
      }
    }
    isGeneratingAllSetter(false);
    setAllProgress('');
  };

  const bakePage = (page, imgSrc, storyText, titleText) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const bannerHeight = Math.round(img.height * 0.20); // 20% fixed footer banner
          const canvasW = img.width;
          const canvasH = img.height + bannerHeight;

          const canvas = document.createElement('canvas');
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext('2d');

          // Draw the original image
          ctx.drawImage(img, 0, 0, canvasW, img.height);

          // Draw white banner at bottom
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, img.height, canvasW, bannerHeight);

          // Draw a thin indigo separator line
          ctx.fillStyle = '#c7d2fe'; // indigo-200
          ctx.fillRect(0, img.height, canvasW, 4);

          // Draw story text centred in the banner
          ctx.fillStyle = '#1e293b'; // slate-800
          ctx.textAlign = 'center';

          // Word-wrap and dynamically scale the font size down to fit within the white space
          const maxWidth = canvasW * 0.88;
          const maxAllowedH = bannerHeight * 0.65; // leave 35% generous margin!
          let fontSize = Math.max(18, Math.round(bannerHeight * 0.16)); // elegant, smaller base size (32px)
          let lines = [];
          let lineH = fontSize * 1.35;
          let totalTextH = 0;

          while (fontSize > 8) {
            ctx.font = `bold ${fontSize}px Georgia, serif`;
            const words = storyText.split(' ');
            lines = [];
            let current = '';
            for (const word of words) {
              const test = current ? `${current} ${word}` : word;
              if (ctx.measureText(test).width > maxWidth && current) {
                lines.push(current);
                current = word;
              } else {
                current = test;
              }
            }
            if (current) lines.push(current);

            lineH = fontSize * 1.35;
            totalTextH = (lines.length - 1) * lineH + fontSize;
            if (totalTextH <= maxAllowedH) {
              break;
            }
            fontSize -= 2;
          }

          // Force top baseline alignment to make overlaps mathematically impossible
          ctx.textBaseline = 'top';
          ctx.font = `bold ${fontSize}px Georgia, serif`;

          // Centered padding, but never allow it to go above the banner (min 16px padding)
          const padding = Math.max(16, (bannerHeight - totalTextH) / 2);
          const startY = img.height + padding;

          lines.forEach((line, i) => {
            ctx.fillText(line, canvasW / 2, startY + i * lineH);
          });

          // Convert canvas to Blob
          canvas.toBlob((blob) => {
            resolve(blob);
          }, 'image/png');
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = (e) => reject(e);
      img.src = imgSrc;
    });
  };

  const handleDownloadPage = async (pageKey = activePageKey) => {
    const imgSrc = activeGeneratedImages[pageKey];
    const storyText = activeStories[pageKey] || '';
    if (!imgSrc) return;

    try {
      const blob = await bakePage(pageKey, imgSrc, storyText, isBook ? 'Book' : habitTitle);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const downloadName = isBook ? `Letter_${pageKey}.png` : `${habitTitle || 'Habit'}_${pageKey}.png`;
      a.download = downloadName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download page:", err);
    }
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const folderName = isBook ? 'ABCD_Book_Pages' : `${habitTitle || 'Habit'}_Pages`;
    const folder = zip.folder(folderName);

    // Get list of pages that have generated images
    const generatedPages = pagesList.filter(pageKey => activeGeneratedImages[pageKey]);
    if (generatedPages.length === 0) return;

    const bakePromises = generatedPages.map(async (pageKey) => {
      const imgSrc = activeGeneratedImages[pageKey];
      const storyText = activeStories[pageKey] || '';
      const blob = await bakePage(pageKey, imgSrc, storyText, isBook ? 'Book' : habitTitle);
      return { pageKey, blob };
    });

    try {
      const results = await Promise.all(bakePromises);
      results.forEach(({ pageKey, blob }) => {
        const fileName = isBook ? `Letter_${pageKey}.png` : `${habitTitle || 'Habit'}_${pageKey}.png`;
        folder.file(fileName, blob);
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `${folderName}.zip`);
    } catch (err) {
      console.error("Failed to download all pages:", err);
    }
  };

  const handleGenerateHabitChart = async () => {
    setIsGeneratingHabitPlan(true);
    setHabitPrompts({});
    setHabitStoryTexts({});
    setHabitEditablePrompt('');
    setHabitPlanProgress({ done: 0, total: 0 });
    setError(null);
    let firstPageSet = false;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/generate-habit-chart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: habitTitle,
          total_scenes: parseInt(habitTotalScenes),
          total_pages: parseInt(habitTotalPages),
          text_model: habitTextModel
        }),
        signal: abortControllerRef.current.signal
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Generation failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // keep incomplete last chunk
        for (const line of lines) {
          if (!line.trim()) continue;
          let msg;
          try { msg = JSON.parse(line); } catch { continue; }

          if (msg.type === 'meta') {
            setHabitPlanProgress({ done: 0, total: msg.total });
          } else if (msg.type === 'page') {
            const page = msg.page;
            const pageData = msg.data;
            setHabitPrompts(prev => ({ ...prev, [page]: pageData }));
            setHabitStoryTexts(prev => ({ ...prev, [page]: pageData.story || '' }));
            setHabitPlanProgress(prev => ({ ...prev, done: prev.done + 1 }));
            if (!firstPageSet) {
              firstPageSet = true;
              setSelectedHabitPage(page);
              setHabitEditablePrompt(pageData.prompt || '');
            }
          } else if (msg.type === 'error') {
            throw new Error(msg.detail || 'Stream error');
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        setError('Generation stopped by user.');
        return;
      }
      setError('Failed to generate habit plan. ' + err.message);
    } finally {
      setIsGeneratingHabitPlan(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl">
            <BookOpen className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Kids Book Generator</h1>
            <p className="text-xs text-slate-500 font-medium tracking-wider">AI Automation Studio</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Powered by {MODEL_LABELS[selectedModel] || selectedModel}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">

        {/* Left Sidebar - Controls */}
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>

          {/* Generator Mode Selection */}
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-slate-400" />
              Generator Mode
            </h2>
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setAppMode('book')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${appMode === 'book' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Alphabet Book
              </button>
              <button
                onClick={() => setAppMode('habit')}
                className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${appMode === 'habit' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Habit Chart
              </button>
            </div>
          </div>

          {/* Image Upload Section */}
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <ImageIcon className="w-3 h-3 text-slate-400" />
              1. Child Reference Photo
            </h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`relative rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden group
                ${referenceImage ? 'border-indigo-200 bg-indigo-50/50' : 'border-slate-200 hover:border-indigo-400 bg-slate-50 hover:bg-slate-100'} 
                h-28 flex flex-col items-center justify-center text-center p-2`}
            >
              {referenceImage ? (
                <>
                  <img src={referenceImage} alt="Reference" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-50 transition-opacity" />
                  <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                    Change Photo
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 text-indigo-500 mb-1" />
                  <p className="text-xs font-medium text-slate-700">Upload Photo</p>
                </>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>
          </div>

          {/* Model Selection */}
          <div className="p-4 border-b border-slate-100">
            <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-slate-400" />
              Image Model
            </h2>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="pollinations">Pollinations (Free)</option>
              <option value="gemini">Gemini Flash</option>
              <option value="huggingface">HuggingFace FLUX</option>
            </select>
          </div>

          {/* Text Model Selection (Only for Habit Chart) */}
          {appMode === 'habit' && (
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-slate-400" />
                Text Model
              </h2>
              <select
                value={habitTextModel}
                onChange={(e) => setHabitTextModel(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ollama">Ollama (Local Qwen3)</option>
                <option value="openrouter">OpenRouter (Cloud Free)</option>
              </select>
            </div>
          )}

          {/* Module-Specific Controls & Page Navigators */}
          <div className="p-4 border-b border-slate-100 flex-1 overflow-y-auto">
            {isBook ? (
              <>
                <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <BookOpen className="w-3 h-3 text-slate-400" />
                  2. Select Letter Page
                </h2>
                <div className="grid grid-cols-7 gap-1.5">
                  {LETTERS.map(letter => (
                    <button
                      key={letter}
                      onClick={() => { setSelectedLetter(letter); }}
                      className={`relative p-1.5 rounded-lg text-center font-bold text-sm transition-all
                        ${selectedLetter === letter
                          ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600 ring-offset-1'
                          : generatedImages[letter]
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                      `}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-slate-400 text-center">
                  {Object.keys(generatedImages).length}/{LETTERS.length} pages generated
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-slate-400" />
                  2. Habit Details
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Chart Title</label>
                    <input
                      type="text"
                      value={habitTitle}
                      onChange={(e) => setHabitTitle(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      placeholder="e.g. Potty Training"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Total Scenes</label>
                      <input
                        type="number"
                        min="1" max="16"
                        value={habitTotalScenes}
                        onChange={(e) => setHabitTotalScenes(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Total Pages</label>
                      <input
                        type="number"
                        min="1" max={habitTotalScenes}
                        value={habitTotalPages}
                        onChange={(e) => setHabitTotalPages(Math.max(1, Math.min(habitTotalScenes, parseInt(e.target.value) || 1)))}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleGenerateHabitChart}
                    disabled={isGeneratingHabitPlan}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all
                      ${isGeneratingHabitPlan ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'}`}
                  >
                    {isGeneratingHabitPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />{' '}
                        {habitPlanProgress.total === 0
                          ? 'Analyzing...'
                          : `Pages ready: ${habitPlanProgress.done} / ${habitPlanProgress.total}`}
                      </>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Chart Plan</>
                    )}
                  </button>
                </div>

                {Object.keys(habitPrompts).length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <h3 className="text-xs font-semibold text-slate-800 mb-2">3. Select Page</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.keys(habitPrompts)
                        .sort((a, b) => {
                          const numA = parseInt(a.split(' ')[1]) || 0;
                          const numB = parseInt(b.split(' ')[1]) || 0;
                          return numA - numB;
                        })
                        .map(page => (
                          <button
                            key={page}
                            onClick={() => { setSelectedHabitPage(page); }}
                            className={`relative p-2 rounded-lg text-center font-bold text-xs transition-all truncate
                              ${selectedHabitPage === page
                                ? 'bg-indigo-600 text-white shadow-md ring-2 ring-indigo-600 ring-offset-1'
                                : habitGeneratedImages[page]
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                            `}
                          >
                            {page}
                          </button>
                        ))}
                    </div>
                    <div className="mt-2 text-xs text-slate-400 text-center">
                      {Object.keys(habitGeneratedImages).length}/{Object.keys(habitPrompts).length} pages generated
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Unified Sidebar Action Buttons (Generate All & Download All ZIP) */}
          {(isBook || Object.keys(habitPrompts).length > 0) && (
            <div className="p-4 space-y-2 border-t border-slate-100 bg-slate-50/50">
              <button
                onClick={handleGenerateAll}
                disabled={isGeneratingAllActive}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all shadow-sm
                  ${isGeneratingAllActive ? 'bg-amber-400 text-white cursor-wait' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
              >
                {isGeneratingAllActive ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> {allProgress}</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Auto-Generate All Pages</>
                )}
              </button>
              {Object.keys(activeGeneratedImages).length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all"
                >
                  <Download className="w-4 h-4" /> Download All ({Object.keys(activeGeneratedImages).length})
                </button>
              )}
            </div>
          )}

        </div>

        {/* Right Area - Canvas & Prompt Editor (Reused Symmetrically) */}
        <div className="flex-1 bg-slate-50 flex flex-col" style={{ height: 'calc(100vh - 57px)' }}>
          <div className="flex-1 p-4 flex gap-4 w-full overflow-hidden">

            {/* Center Panel: Canvas */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-800">
                  {isBook ? `Letter ${activePageKey} Page` : `${habitTitle} - ${activePageKey}`}
                </h2>
                <div className="flex items-center gap-2">
                  {activeModelUsed[activePageKey] && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                      via {MODEL_LABELS[activeModelUsed[activePageKey]]}
                    </span>
                  )}
                  {activeGeneratedImages[activePageKey] && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Generated
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0">
                <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200 flex items-center justify-center min-h-0">
                  {isGeneratingActiveImage ? (
                    <div className="flex flex-col items-center text-indigo-600">
                      <Loader2 className="w-8 h-8 animate-spin mb-3" />
                      <p className="font-medium animate-pulse text-sm">Painting your masterpiece...</p>
                    </div>
                  ) : activeGeneratedImages[activePageKey] ? (
                    <div className="flex flex-col h-full w-full bg-white overflow-hidden">
                      {/* Image Section */}
                      <div className="flex-1 bg-slate-50 relative min-h-0 flex items-center justify-center p-2">
                        <img
                          src={activeGeneratedImages[activePageKey]}
                          alt={`Generated illustration for ${activePageKey}`}
                          className="w-full h-full object-contain rounded-lg shadow-sm border border-slate-200"
                        />
                      </div>
                      {/* Storybook Text Banner */}
                      <div className="px-4 py-3 bg-white border-t-2 border-indigo-100 flex-shrink-0">
                        <textarea
                          value={activeStories[activePageKey] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (isBook) {
                              setBookStories(prev => ({ ...prev, [activePageKey]: val }));
                            } else {
                              setHabitStoryTexts(prev => ({ ...prev, [activePageKey]: val }));
                            }
                          }}
                          rows={2}
                          className="w-full text-center text-base font-bold text-slate-800 leading-relaxed font-serif tracking-wide resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-lg p-2 bg-transparent border border-transparent hover:border-indigo-100 transition-colors"
                          placeholder="Story text will appear here after generating..."
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-slate-400 p-6">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="font-medium text-slate-500 mb-1">Canvas is empty</p>
                      <p className="text-xs">Click generate to render the '{activePageKey}' illustration</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-2 p-2 bg-red-50 text-red-700 rounded-lg border border-red-100 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="text-xs">{error}</p>
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => handleGenerateImage(activePageKey, activePromptText)}
                    disabled={isGeneratingActiveImage || isGeneratingAllActive || (!isBook && Object.keys(habitPrompts).length === 0)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all
                      ${(isGeneratingActiveImage || (!isBook && Object.keys(habitPrompts).length === 0)) ? 'bg-indigo-400 text-white cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'}`}
                  >
                    {isGeneratingActiveImage ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate '{activePageKey}'</>
                    )}
                  </button>

                  {activeGeneratedImages[activePageKey] && (
                    <button
                      onClick={() => handleDownloadPage(activePageKey)}
                      className="px-4 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                      title="Download Page with Text"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel: Prompt Editor */}
            <div className="w-80 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                  Active Prompt
                </h3>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                <textarea
                  value={activePromptText}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  className="flex-1 w-full p-4 text-xs text-slate-600 leading-relaxed font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-2xl"
                  placeholder="Page prompt will load here..."
                />
              </div>

              <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  <strong>Tip:</strong> Edit the prompt above, then click Generate. Your custom details will be used immediately.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
