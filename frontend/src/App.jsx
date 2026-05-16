import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Sparkles, BookOpen, Download, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
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
  "J": "Rithvin, a 3-year-old boy with warm golden brown skin, black short curly hair, dark brown eyes, chubby cute cheeks, cheerful joyful expression, wearing a bright red t-shirt and matching red shorts with small playful patterns, fully clothed.\n\nRendered as an ultra-realistic 3D Pixar-style cartoon character. Soft studio lighting, subsurface skin scattering, big expressive sparkly eyes, clean crisp render.\n\npeeking curiously into a glowing mason jar full of tiny fireflies, soft golden light illuminating their face with wonder, both hands around the jar.\n\nLetter \"J\" for Jar. Centered full-body or 3/4 body composition, clean soft pastel background with subtle jar-themed color wash, single large glowing letter \"J\" visible as a prop or in background. Warm joyful lighting, storybook magic, ultra-detailed, Pixar animation quality, no clutter, no other characters, no text overlay, portrait orientation, A5 page size.\n\nThe word \"Jar\" should appear as the label text below the scene in english script — large, bold, rounded, child-friendly font style.\n\nNEGATIVE: ugly, deformed, extra fingers, extra limbs, mutated hands, poorly drawn face, scary, creepy, horror, adult face, realistic human photo, blurry, low quality, dark, violent, text overlay, watermark, logo, nsfw, nude, naked, shirtless, bare chest, bare skin, topless, undressed, exposed body, multiple children, crowded scene, busy background, cluttered, dark background, bad anatomy, out of frame, cropped, distorted",
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
  const [selectedLetter, setSelectedLetter] = useState('A');
  const [generatedImages, setGeneratedImages] = useState({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedModel, setSelectedModel] = useState('pollinations');
  const [editablePrompt, setEditablePrompt] = useState('');
  const [promptLoaded, setPromptLoaded] = useState(false);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [allProgress, setAllProgress] = useState('');
  const [modelUsed, setModelUsed] = useState({});

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

  const handleShowPrompt = () => {
    setEditablePrompt(BOOK_PROMPTS[selectedLetter]);
    setPromptLoaded(true);
  };

  const handleGenerate = async (letter = selectedLetter, prompt = null) => {
    setIsGenerating(true);
    setError(null);
    const promptText = prompt || (promptLoaded ? editablePrompt : BOOK_PROMPTS[letter]);

    try {
      const response = await fetch('/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptText,
          image: referenceImage,
          model: selectedModel
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Generation failed");

      setGeneratedImages(prev => ({ ...prev, [letter]: data.image }));
      setModelUsed(prev => ({ ...prev, [letter]: selectedModel }));
    } catch (err) {
      setError("Failed to generate image. " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAll = async () => {
    setGeneratingAll(true);
    setError(null);
    for (let i = 0; i < LETTERS.length; i++) {
      const letter = LETTERS[i];
      setAllProgress(`Generating ${letter} (${i + 1}/${LETTERS.length})...`);
      setSelectedLetter(letter);
      try {
        await handleGenerateOne(letter);
      } catch (err) {
        console.error(`Failed ${letter}:`, err);
      }
    }
    setAllProgress('');
    setGeneratingAll(false);
  };

  const handleGenerateOne = async (letter) => {
    const promptText = BOOK_PROMPTS[letter];
    const response = await fetch('/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText, image: referenceImage, model: selectedModel })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Generation failed");
    setGeneratedImages(prev => ({ ...prev, [letter]: data.image }));
    setModelUsed(prev => ({ ...prev, [letter]: selectedModel }));
  };

  const handleDownloadAll = async () => {
    const zip = new JSZip();
    const folder = zip.folder('ABCD_Book_Pages');
    Object.entries(generatedImages).forEach(([letter, imgData]) => {
      // Strip the data:image/...;base64, prefix
      const base64 = imgData.split(',')[1];
      folder.file(`Page_${letter}.png`, base64, { base64: true });
    });
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'ABCD_Book_Pages.zip');
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
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">A-Z Automation Studio</p>
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
        <div className="w-72 bg-white border-r border-slate-200 flex flex-col" style={{height:'calc(100vh - 57px)'}}>

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
              Model
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

          {/* Letter Navigation */}
          <div className="p-4 border-b border-slate-100 flex-1 overflow-y-auto">
            <h2 className="text-xs font-semibold text-slate-800 mb-2 flex items-center gap-2">
              <BookOpen className="w-3 h-3 text-slate-400" />
              2. Select Page
            </h2>
            <div className="grid grid-cols-7 gap-1.5">
              {LETTERS.map(letter => (
                <button
                  key={letter}
                  onClick={() => { setSelectedLetter(letter); setPromptLoaded(false); }}
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
          </div>

          {/* Action Buttons */}
          <div className="p-4 space-y-2">
            <button
              onClick={handleGenerateAll}
              disabled={isGenerating || generatingAll}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all
                ${generatingAll ? 'bg-amber-400 text-white cursor-wait' : 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'}`}
            >
              {generatingAll ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {allProgress}</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate All Pages</>
              )}
            </button>
            {Object.keys(generatedImages).length > 0 && (
              <button
                onClick={handleDownloadAll}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-md transition-all"
              >
                <Download className="w-4 h-4" /> Download All ({Object.keys(generatedImages).length})
              </button>
            )}
          </div>
        </div>

        {/* Right Area - Canvas & Prompt */}
        <div className="flex-1 bg-slate-50 flex flex-col" style={{height:'calc(100vh - 57px)'}}>
          <div className="flex-1 p-4 flex gap-4 w-full overflow-hidden">

            {/* Generation Canvas */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-slate-800">
                  Letter {selectedLetter} Page
                </h2>
                <div className="flex items-center gap-2">
                  {modelUsed[selectedLetter] && (
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs font-medium rounded-full">
                      via {MODEL_LABELS[modelUsed[selectedLetter]]}
                    </span>
                  )}
                  {generatedImages[selectedLetter] && (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wide rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Generated
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex-1 flex flex-col min-h-0">
                <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden relative border border-slate-200 flex items-center justify-center min-h-0">
                  {isGenerating ? (
                    <div className="flex flex-col items-center text-indigo-600">
                      <Loader2 className="w-8 h-8 animate-spin mb-3" />
                      <p className="font-medium animate-pulse text-sm">Painting your masterpiece...</p>
                    </div>
                  ) : generatedImages[selectedLetter] ? (
                    <img
                      src={generatedImages[selectedLetter]}
                      alt={`Generated illustration for ${selectedLetter}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center text-slate-400 p-6">
                      <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                      <p className="font-medium text-slate-500 mb-1">Canvas is empty</p>
                      <p className="text-xs">Click generate to render the {selectedLetter} illustration</p>
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
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || generatingAll}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-sm transition-all
                      ${isGenerating ? 'bg-indigo-400 text-white cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg'}`}
                  >
                    {isGenerating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate '{selectedLetter}'</>
                    )}
                  </button>
                  {generatedImages[selectedLetter] && (
                    <a
                      href={generatedImages[selectedLetter]}
                      download={`Page_${selectedLetter}.png`}
                      className="px-4 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors"
                      title="Download Image"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Prompt Editor Panel */}
            <div className="w-80 flex flex-col min-h-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                  Active Prompt
                </h3>
                <button
                  onClick={handleShowPrompt}
                  className="px-3 py-1 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  {promptLoaded ? 'Reset Prompt' : 'Show Prompt'}
                </button>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex-1 flex flex-col min-h-0 overflow-hidden">
                {promptLoaded ? (
                  <textarea
                    value={editablePrompt}
                    onChange={(e) => setEditablePrompt(e.target.value)}
                    className="flex-1 w-full p-4 text-xs text-slate-600 leading-relaxed font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-200 rounded-2xl"
                    placeholder="Click 'Show Prompt' to load and edit the prompt..."
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-center p-6 text-center text-slate-400">
                    <div>
                      <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-xs font-medium">Click "Show Prompt" to view & edit</p>
                      <p className="text-xs mt-1">Edited prompts will be used for generation</p>
                    </div>
                  </div>
                )}
              </div>

              {promptLoaded && (
                <div className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs text-amber-700">
                    <strong>Tip:</strong> Edit the prompt above, then click Generate. Your edited version will be used.
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
