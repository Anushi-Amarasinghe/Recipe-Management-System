/**
 * Seed Script: Add 10 Mock Recipes for Demo
 * 
 * Run this script with: node seedRecipes.js
 * Make sure MongoDB is running and .env has MONGO_URI
 */

const mongoose = require("mongoose");
require("dotenv").config();

// Recipe Schema (matches your existing model)
const recipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    ingredients: { type: [String], required: true },
    instructions: { type: String, required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    cookingTime: { type: Number, min: 1 },
    difficulty: { type: String, enum: ["easy", "medium", "hard"] },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" }
  },
  { timestamps: true }
);

const Recipe = mongoose.model("Recipe", recipeSchema);

// 10 Mock Recipes Data
const mockRecipes = [
  {
    title: "Classic Spaghetti Carbonara",
    ingredients: [
      "400g spaghetti",
      "200g pancetta or bacon",
      "4 large eggs",
      "100g Parmesan cheese, grated",
      "2 cloves garlic",
      "Salt and black pepper",
      "2 tbsp olive oil"
    ],
    instructions: "1. Cook spaghetti in salted boiling water until al dente. Reserve 1 cup pasta water before draining.\n\n2. While pasta cooks, cut pancetta into small cubes. Heat olive oil in a large pan over medium heat.\n\n3. Add pancetta and cook until crispy, about 5-7 minutes. Add minced garlic and cook for 1 minute.\n\n4. In a bowl, whisk together eggs, grated Parmesan, and black pepper.\n\n5. Remove pan from heat. Add drained pasta to the pancetta. Quickly pour egg mixture over pasta, tossing constantly.\n\n6. Add pasta water as needed to create a creamy sauce. Serve immediately with extra Parmesan.",
    cookingTime: 25,
    difficulty: "medium"
  },
  {
    title: "Chicken Stir Fry",
    ingredients: [
      "500g chicken breast, sliced",
      "2 cups mixed vegetables (bell peppers, broccoli, carrots)",
      "3 tbsp soy sauce",
      "2 tbsp oyster sauce",
      "1 tbsp sesame oil",
      "2 cloves garlic, minced",
      "1 inch ginger, grated",
      "2 tbsp vegetable oil",
      "1 tsp cornstarch"
    ],
    instructions: "1. Mix soy sauce, oyster sauce, and cornstarch in a small bowl. Set aside.\n\n2. Heat vegetable oil in a wok or large pan over high heat.\n\n3. Add chicken pieces and stir-fry for 4-5 minutes until golden. Remove and set aside.\n\n4. Add more oil if needed. Stir-fry garlic and ginger for 30 seconds.\n\n5. Add vegetables and stir-fry for 3-4 minutes until crisp-tender.\n\n6. Return chicken to the wok. Pour sauce over and toss everything together.\n\n7. Cook for 2 minutes until sauce thickens. Drizzle with sesame oil and serve with rice.",
    cookingTime: 20,
    difficulty: "easy"
  },
  {
    title: "Homemade Margherita Pizza",
    ingredients: [
      "500g pizza dough",
      "200ml tomato sauce",
      "250g fresh mozzarella",
      "Fresh basil leaves",
      "2 tbsp olive oil",
      "1 tsp dried oregano",
      "Salt to taste",
      "Semolina for dusting"
    ],
    instructions: "1. Preheat oven to 250°C (480°F) with a pizza stone or baking sheet inside.\n\n2. Roll out pizza dough on a floured surface to desired thickness.\n\n3. Transfer dough to a semolina-dusted pizza peel or parchment paper.\n\n4. Spread tomato sauce evenly, leaving a 1-inch border for the crust.\n\n5. Tear mozzarella into pieces and distribute over the sauce.\n\n6. Drizzle with olive oil and sprinkle with oregano and salt.\n\n7. Slide pizza onto hot stone and bake for 10-12 minutes until crust is golden.\n\n8. Remove from oven, top with fresh basil leaves, and serve immediately.",
    cookingTime: 30,
    difficulty: "medium"
  },
  {
    title: "Creamy Mushroom Soup",
    ingredients: [
      "500g mixed mushrooms, sliced",
      "1 onion, diced",
      "3 cloves garlic, minced",
      "4 cups vegetable broth",
      "1 cup heavy cream",
      "2 tbsp butter",
      "2 tbsp flour",
      "Fresh thyme",
      "Salt and pepper"
    ],
    instructions: "1. Melt butter in a large pot over medium heat. Add onions and cook until soft, about 5 minutes.\n\n2. Add mushrooms and garlic. Cook for 8-10 minutes until mushrooms release their liquid and brown.\n\n3. Sprinkle flour over mushrooms and stir for 1 minute.\n\n4. Gradually add vegetable broth, stirring constantly to prevent lumps.\n\n5. Add thyme, salt, and pepper. Simmer for 15 minutes.\n\n6. Remove from heat. Blend half the soup for texture (optional).\n\n7. Stir in heavy cream and heat through. Adjust seasoning and serve with crusty bread.",
    cookingTime: 35,
    difficulty: "easy"
  },
  {
    title: "Beef Tacos with Fresh Salsa",
    ingredients: [
      "500g ground beef",
      "8 taco shells",
      "1 packet taco seasoning",
      "2 tomatoes, diced",
      "1 onion, diced",
      "1 jalapeño, minced",
      "Fresh cilantro",
      "1 lime, juiced",
      "Shredded lettuce",
      "Sour cream",
      "Shredded cheese"
    ],
    instructions: "1. For salsa: Mix diced tomatoes, half the onion, jalapeño, cilantro, lime juice, and salt. Refrigerate.\n\n2. Brown ground beef in a skillet over medium-high heat, breaking it into crumbles.\n\n3. Drain excess fat. Add remaining onion and cook for 2 minutes.\n\n4. Add taco seasoning and water as directed on packet. Simmer for 5 minutes.\n\n5. Warm taco shells according to package instructions.\n\n6. Assemble tacos: Add beef, lettuce, cheese, salsa, and sour cream.\n\n7. Serve immediately with lime wedges on the side.",
    cookingTime: 25,
    difficulty: "easy"
  },
  {
    title: "Thai Green Curry",
    ingredients: [
      "400g chicken thighs, cubed",
      "400ml coconut milk",
      "3 tbsp green curry paste",
      "1 cup Thai basil leaves",
      "1 red bell pepper, sliced",
      "100g bamboo shoots",
      "2 tbsp fish sauce",
      "1 tbsp palm sugar",
      "2 kaffir lime leaves",
      "Thai chilies (optional)"
    ],
    instructions: "1. Heat 2 tbsp coconut cream (thick part) in a wok over medium heat.\n\n2. Add green curry paste and fry for 2 minutes until fragrant.\n\n3. Add chicken pieces and stir-fry for 3-4 minutes until sealed.\n\n4. Pour in remaining coconut milk. Add kaffir lime leaves.\n\n5. Bring to a simmer and cook for 10 minutes.\n\n6. Add bell pepper, bamboo shoots, fish sauce, and palm sugar.\n\n7. Cook for another 5 minutes. Add Thai basil and chilies.\n\n8. Serve hot over jasmine rice.",
    cookingTime: 30,
    difficulty: "medium"
  },
  {
    title: "Classic French Omelette",
    ingredients: [
      "3 large eggs",
      "1 tbsp butter",
      "2 tbsp fresh herbs (chives, parsley)",
      "Salt and white pepper",
      "Optional: 30g cheese, ham, or mushrooms"
    ],
    instructions: "1. Crack eggs into a bowl. Add salt and pepper. Beat with a fork until just combined.\n\n2. Heat an 8-inch non-stick pan over medium-high heat. Add butter.\n\n3. When butter foams and starts to subside, pour in eggs.\n\n4. Let eggs set for 10 seconds, then use a spatula to push edges toward center.\n\n5. Tilt pan to let uncooked egg flow to edges. Repeat until mostly set but still creamy.\n\n6. Add fillings to one half if using. Remove from heat.\n\n7. Fold omelette in half and slide onto a plate. Garnish with fresh herbs.",
    cookingTime: 10,
    difficulty: "easy"
  },
  {
    title: "Slow-Cooked Beef Stew",
    ingredients: [
      "1kg beef chuck, cubed",
      "4 potatoes, quartered",
      "3 carrots, chunked",
      "2 celery stalks, sliced",
      "1 onion, diced",
      "4 cups beef broth",
      "2 tbsp tomato paste",
      "2 tbsp flour",
      "2 bay leaves",
      "Fresh thyme and rosemary",
      "Salt and pepper"
    ],
    instructions: "1. Season beef with salt and pepper. Coat lightly with flour.\n\n2. Heat oil in a Dutch oven. Brown beef in batches. Remove and set aside.\n\n3. Sauté onion and celery for 5 minutes. Add tomato paste and cook 1 minute.\n\n4. Return beef to pot. Add broth, bay leaves, and herbs.\n\n5. Bring to a boil, then reduce heat. Cover and simmer for 1.5 hours.\n\n6. Add potatoes and carrots. Continue cooking for 45 minutes until vegetables are tender.\n\n7. Remove bay leaves. Adjust seasoning and serve with crusty bread.",
    cookingTime: 150,
    difficulty: "medium"
  },
  {
    title: "Chocolate Lava Cake",
    ingredients: [
      "200g dark chocolate",
      "100g butter",
      "2 whole eggs",
      "2 egg yolks",
      "50g sugar",
      "2 tbsp flour",
      "Butter and cocoa for ramekins",
      "Vanilla ice cream for serving"
    ],
    instructions: "1. Preheat oven to 200°C (400°F). Butter 4 ramekins and dust with cocoa powder.\n\n2. Melt chocolate and butter together in a double boiler or microwave. Stir until smooth.\n\n3. In a separate bowl, whisk eggs, egg yolks, and sugar until thick and pale.\n\n4. Fold chocolate mixture into egg mixture. Sift in flour and fold gently.\n\n5. Divide batter among ramekins. Place on a baking sheet.\n\n6. Bake for 12-14 minutes. Edges should be firm but center soft.\n\n7. Let cool 1 minute. Run a knife around edges, invert onto plates.\n\n8. Serve immediately with vanilla ice cream.",
    cookingTime: 25,
    difficulty: "hard"
  },
  {
    title: "Mediterranean Quinoa Salad",
    ingredients: [
      "1 cup quinoa",
      "1 cucumber, diced",
      "1 cup cherry tomatoes, halved",
      "1/2 red onion, finely diced",
      "100g feta cheese, crumbled",
      "1/2 cup Kalamata olives",
      "1/4 cup olive oil",
      "2 tbsp lemon juice",
      "Fresh parsley and mint",
      "Salt and pepper"
    ],
    instructions: "1. Rinse quinoa under cold water. Cook in 2 cups water until tender, about 15 minutes. Fluff and cool.\n\n2. While quinoa cools, prepare vegetables. Dice cucumber, halve tomatoes, slice onion.\n\n3. Make dressing: Whisk olive oil, lemon juice, salt, and pepper.\n\n4. In a large bowl, combine cooled quinoa, cucumber, tomatoes, onion, and olives.\n\n5. Pour dressing over salad and toss well.\n\n6. Add crumbled feta and fresh herbs. Toss gently.\n\n7. Refrigerate for 30 minutes before serving. Can be served cold or at room temperature.",
    cookingTime: 30,
    difficulty: "easy"
  }
];

// Main seeding function
async function seedRecipes() {
  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Find an admin user to associate recipes with
    const User = mongoose.model("User", new mongoose.Schema({
      f_name: String,
      l_name: String,
      email: String,
      role: String
    }));

    // Try to find an admin user, or any user
    let user = await User.findOne({ role: "admin" });
    if (!user) {
      user = await User.findOne();
    }

    if (!user) {
      console.log("❌ No users found in database. Please create a user first.");
      process.exit(1);
    }

    console.log(`📝 Using user: ${user.f_name} ${user.l_name} (${user.email})`);

    // Check existing recipes
    const existingCount = await Recipe.countDocuments();
    console.log(`📊 Existing recipes: ${existingCount}`);

    // Add user ID to each recipe
    const recipesWithUser = mockRecipes.map(recipe => ({
      ...recipe,
      user: user._id
    }));

    // Insert recipes
    console.log("\n🍳 Adding 10 mock recipes...\n");
    
    for (let i = 0; i < recipesWithUser.length; i++) {
      const recipe = recipesWithUser[i];
      const newRecipe = await Recipe.create(recipe);
      console.log(`  ${i + 1}. ✅ ${recipe.title} (${recipe.difficulty}, ${recipe.cookingTime} min)`);
    }

    // Final count
    const finalCount = await Recipe.countDocuments();
    console.log(`\n✅ Done! Total recipes now: ${finalCount}`);

    // Close connection
    await mongoose.connection.close();
    console.log("📤 Database connection closed");

  } catch (error) {
    console.error("❌ Error seeding recipes:", error.message);
    process.exit(1);
  }
}

// Run the seeder
seedRecipes();
