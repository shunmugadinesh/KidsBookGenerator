# List down the types of book types

1. Letter/number books
2. Habit/behavior books
3. Story books 
4. Fun/adventure books
5. Picture/drawing books
6. Puzzle/educational books
7. Coloring/Activity books
8. Holiday/seasonal books
9. Bedtime/Social Emotional books
10. Travel/Vehicle books
11. Nature/Animal books
12. Sensory/Shape/Color books


# We can't apply same template for each book type

## for example, for letter books we need a page for each letter, where we have to generate image and text for each letter. but for story books we don't have any template.

So identify each book pattern and how it should be created 

1. **Letter/Number books pattern:**

    We have to generate a page for each letter/number.

    Input will be letter/number. and we have to generate image and text for each letter/number.

    We can create 26 pages for each letter/number.
    
    layout:
    default - 1 page , 1 letter/number
    if user request less page then, need to create collage of multiple letters/numbers in one page.

2. **Habit/behavior books pattern:**

    Input will be habit/behavior. and we have to generate image and text for each habit/behavior.
    each Pages will represent one step of the habit/behavior.

    layout:
    default - 1 page , 2 scene
    if user request more scene per page then, need to create collage of images in one page. and we have to add a text for each image in the page.    