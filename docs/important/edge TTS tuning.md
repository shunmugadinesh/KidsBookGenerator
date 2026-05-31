# Microsoft Edge TTS (Azure Neural TTS) Tuning Guide

Microsoft Edge TTS is powered by the incredibly robust Azure Cognitive Services Neural TTS engine. It is completely free, unlimited, and highly responsive to tuning.

## Here is a custom Voice-Over Template that includes every single punctuation trick from the tuning guide.

```
Once upon a time, there was a tiny, brave mouse named Pip.
Pip looked up at the giant cheese wheel and wondered... "Can I reach it?"
Suddenly, a loud noise echoed through the kitchen!
It was the cat—the biggest, meanest cat in the house.
Pip froze... his little heart beating fast. 
"Don't move a muscle," Pip whispered to himself, "he can't see you."
But the cat stepped closer, closer, closer... until... 
Whoosh! Pip dashed away!
```

## 1. Pacing & Punctuation Tricks
The AI natively alters its tone, pitch, and pacing based on the punctuation it encounters. You can manipulate the script to force the AI into specific reading patterns:

- **The Ellipsis (`...`)**: This is the most powerful tool for rhymes and dramatic stories. Placing `...` forces a noticeable, natural-sounding pause. 
  - *Example:* "The big bad wolf huffed... and he puffed... and he blew the house down."
- **The Comma (`,`)**: Creates a short breath pause.
- **The Period (`.`)**: A standard sentence-ending pause with a downward vocal inflection (finality).
- **The Question Mark (`?`)**: Automatically raises the pitch at the end of the sentence to indicate a query.
- **The Exclamation Mark (`!`)**: Increases the volume, energy, and speed of the delivery for excitement or urgency.
- **The Em Dash (`—`)**: Creates an abrupt, sharp pause, great for interruptions.
- **Quotation Marks (`" "`)**: Subtly shifts the voice pitch, simulating a narrator reading dialogue for a character.

## 2. Parameter Tuning
Beyond punctuation, the engine accepts parameters to directly manipulate the voice:

### Rate (Speed)
You can speed up or slow down the voice.
- **Slow (`-15%` to `-20%`)**: Perfect for nursery rhymes, toddler books, or sad moments. It stretches the vowels and makes the voice sound more patient.
- **Normal (`+0%`)**: Standard conversational pace.
- **Fast (`+10%` to `+15%`)**: Good for action sequences or fast-talking characters.

### Pitch
You can adjust the base frequency of the voice.
- **Higher Pitch (`+10Hz` or `+5%`)**: Makes the voice sound younger, smaller, or more excited.
- **Lower Pitch (`-10Hz` or `-5%`)**: Makes the voice sound older, larger, or more serious.

### Volume
You can increase or decrease the raw output volume (e.g., `+20%`, `-20%`).

---

## Combining Techniques for Kids Books
**For Nursery Rhymes:**
- Set the Rate to `-15%`.
- Automatically append `...` to the end of every line.
- *Result:* A melodic, patient reading with distinct pauses between rhyming couplets, perfect for children following along.

**For Action Stories:**
- Set the Rate to `+5%`.
- Use plenty of `!` for action descriptions.
- *Result:* An energetic, gripping narration that keeps kids engaged.
