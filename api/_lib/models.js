import mongoose from 'mongoose'

const { Schema } = mongoose

const opts = {
  timestamps: { createdAt: 'created_date', updatedAt: 'updated_date' },
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform(doc, ret) {
      ret.id = ret._id.toString()
      delete ret._id
      delete ret.password_hash
    },
  },
}

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, default: '' },
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
  },
  opts
)

const FoodItemSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    brand: { type: String, default: '' },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    unit_name: { type: String, default: '' },
    unit_weight_grams: { type: Number, default: null },
  },
  opts
)

const MacroGoalSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
    weekly_calories: { type: Number, default: 0 },
    weekly_protein: { type: Number, default: 0 },
    weekly_carbs: { type: Number, default: 0 },
    weekly_fat: { type: Number, default: 0 },
    alert_calories_pct: { type: Number, default: 0 },
    alert_protein_pct: { type: Number, default: 0 },
    alert_carbs_pct: { type: Number, default: 0 },
    alert_fat_pct: { type: Number, default: 0 },
  },
  opts
)

const MealLogSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    meal_category: {
      type: String,
      required: true,
      enum: ['breakfast', 'lunch', 'dinner', 'snacks'],
    },
    food_item_id: { type: String, required: true },
    food_name: { type: String, required: true },
    servings: { type: Number, required: true },
    // Display unit: 'g' when servings means grams (foods), 'srv' for recipes
    unit: { type: String, enum: ['g', 'srv'], default: 'g' },
    calories: { type: Number, required: true },
    protein: { type: Number, required: true },
    carbs: { type: Number, required: true },
    fat: { type: Number, required: true },
  },
  opts
)

const IngredientSchema = new Schema(
  {
    food_item_id: String,
    food_name: String,
    grams: Number,
    calories: Number,
    protein: Number,
    carbs: Number,
    fat: Number,
  },
  { _id: false }
)

const RecipeSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    ingredients: { type: [IngredientSchema], required: true },
    total_calories: { type: Number, default: 0 },
    total_protein: { type: Number, default: 0 },
    total_carbs: { type: Number, default: 0 },
    total_fat: { type: Number, default: 0 },
    servings: { type: Number, default: 1 },
  },
  opts
)

const DailyLogSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    date: { type: String, required: true, index: true },
    supplements: [
      new Schema(
        {
          name: { type: String, required: true },
          isTaken: { type: Boolean, default: false },
        },
        { _id: false }
      ),
    ],
  },
  opts
)

// Guard against model recompilation on warm invocations
export const User = mongoose.models.User || mongoose.model('User', UserSchema)
export const FoodItem = mongoose.models.FoodItem || mongoose.model('FoodItem', FoodItemSchema)
export const MacroGoal = mongoose.models.MacroGoal || mongoose.model('MacroGoal', MacroGoalSchema)
export const MealLog = mongoose.models.MealLog || mongoose.model('MealLog', MealLogSchema)
export const Recipe = mongoose.models.Recipe || mongoose.model('Recipe', RecipeSchema)
export const DailyLog = mongoose.models.DailyLog || mongoose.model('DailyLog', DailyLogSchema)
