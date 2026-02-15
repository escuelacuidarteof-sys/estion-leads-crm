import { supabase } from './supabaseClient';
import {
  NutritionPlan,
  NutritionRecipe,
  ClientNutritionAssignment,
  ClientNutritionOverride,
  NutritionPlanVersion,
  RecipeCategory,
  RecipeIngredient
} from '../types';

// ==========================================
// NUTRITION PLANS SERVICE
// ==========================================

export const nutritionService = {
  // --- PLANS ---

  async getPlans(filters?: { status?: string; tags?: string[] }): Promise<NutritionPlan[]> {
    let query = supabase
      .from('nutrition_plans')
      .select(`
        *,
        nutrition_recipes(count),
        client_nutrition_assignments(count)
      `)
      .order('updated_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.tags && filters.tags.length > 0) {
      query = query.contains('tags', filters.tags);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []).map(plan => ({
      ...plan,
      recipes_count: plan.nutrition_recipes?.[0]?.count || 0,
      assigned_clients_count: plan.client_nutrition_assignments?.[0]?.count || 0
    }));
  },

  async getPlanById(planId: string): Promise<NutritionPlan | null> {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  },

  async createPlan(plan: Partial<NutritionPlan>): Promise<NutritionPlan> {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .insert({
        name: plan.name,
        description: plan.description,
        tags: plan.tags || [],
        target_calories: plan.target_calories,
        diet_type: plan.diet_type,
        target_month: plan.target_month,
        target_fortnight: plan.target_fortnight,
        instructions: plan.instructions,
        // Block Content
        intro_content: plan.intro_content,
        breakfast_content: plan.breakfast_content,
        lunch_content: plan.lunch_content,
        dinner_content: plan.dinner_content,
        snack_content: plan.snack_content,

        status: 'draft',
        created_by: plan.created_by
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePlan(planId: string, updates: Partial<NutritionPlan>): Promise<NutritionPlan> {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletePlan(planId: string): Promise<void> {
    const { error } = await supabase
      .from('nutrition_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
  },

  async publishPlan(planId: string, userId: string): Promise<NutritionPlan> {
    // First, create a version snapshot
    const recipes = await this.getRecipesByPlan(planId);
    const plan = await this.getPlanById(planId);

    if (!plan) throw new Error('Plan not found');

    // Get next version number
    const { data: versions } = await supabase
      .from('nutrition_plan_versions')
      .select('version_number')
      .eq('plan_id', planId)
      .order('version_number', { ascending: false })
      .limit(1);

    const nextVersion = (versions?.[0]?.version_number || 0) + 1;

    // Create version snapshot
    await supabase.from('nutrition_plan_versions').insert({
      plan_id: planId,
      version_number: nextVersion,
      snapshot: { plan, recipes }
    });

    // Update plan status
    const { data, error } = await supabase
      .from('nutrition_plans')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        published_by: userId,
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    // Mark all recipes as not draft
    await supabase
      .from('nutrition_recipes')
      .update({ is_draft: false })
      .eq('plan_id', planId);

    return data;
  },

  async unpublishPlan(planId: string): Promise<NutritionPlan> {
    const { data, error } = await supabase
      .from('nutrition_plans')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // --- RECIPES ---

  async getRecipesByPlan(planId: string): Promise<NutritionRecipe[]> {
    const { data, error } = await supabase
      .from('nutrition_recipes')
      .select('*')
      .eq('plan_id', planId)
      .order('category')
      .order('position');

    if (error) throw error;
    return data || [];
  },

  async getRecipesByCategory(planId: string, category: RecipeCategory): Promise<NutritionRecipe[]> {
    const { data, error } = await supabase
      .from('nutrition_recipes')
      .select('*')
      .eq('plan_id', planId)
      .eq('category', category)
      .order('position');

    if (error) throw error;
    return data || [];
  },

  async getRecipeById(recipeId: string): Promise<NutritionRecipe | null> {
    const { data, error } = await supabase
      .from('nutrition_recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data;
  },

  async createRecipe(recipe: Partial<NutritionRecipe>): Promise<NutritionRecipe> {
    const { data, error } = await supabase
      .from('nutrition_recipes')
      .insert({
        plan_id: recipe.plan_id,
        category: recipe.category,
        position: recipe.position || 0,
        name: recipe.name,
        ingredients: recipe.ingredients || [],
        preparation: recipe.preparation,
        calories: recipe.calories,
        protein: recipe.protein,
        carbs: recipe.carbs,
        fat: recipe.fat,
        fiber: recipe.fiber,
        image_url: recipe.image_url,
        is_draft: true
      })
      .select()
      .single();

    if (error) throw error;

    // Mark plan as having changes (draft)
    await supabase
      .from('nutrition_plans')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', recipe.plan_id);

    return data;
  },

  async createRecipesBatch(recipes: Partial<NutritionRecipe>[]): Promise<void> {
    if (recipes.length === 0) return;

    const { error } = await supabase
      .from('nutrition_recipes')
      .insert(recipes.map(r => ({
        plan_id: r.plan_id,
        category: r.category,
        position: r.position || 0,
        name: r.name,
        ingredients: r.ingredients || [],
        preparation: r.preparation,
        calories: r.calories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        fiber: r.fiber,
        image_url: r.image_url,
        is_draft: true
      })));

    if (error) throw error;

    // Mark plan as having changes
    const planId = recipes[0].plan_id;
    if (planId) {
      await supabase
        .from('nutrition_plans')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', planId);
    }
  },

  async updateRecipe(recipeId: string, updates: Partial<NutritionRecipe>): Promise<NutritionRecipe> {
    const { data, error } = await supabase
      .from('nutrition_recipes')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', recipeId)
      .select()
      .single();

    if (error) throw error;

    // Mark plan as having changes
    if (data.plan_id) {
      await supabase
        .from('nutrition_plans')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', data.plan_id);
    }

    return data;
  },

  async deleteRecipe(recipeId: string): Promise<void> {
    // Get recipe to find plan_id
    const recipe = await this.getRecipeById(recipeId);

    const { error } = await supabase
      .from('nutrition_recipes')
      .delete()
      .eq('id', recipeId);

    if (error) throw error;

    // Mark plan as having changes
    if (recipe?.plan_id) {
      await supabase
        .from('nutrition_plans')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', recipe.plan_id);
    }
  },

  // --- ASSIGNMENTS ---

  async getAssignmentsByPlan(planId: string): Promise<ClientNutritionAssignment[]> {
    const { data, error } = await supabase
      .from('client_nutrition_assignments')
      .select(`
        *,
        clientes!client_id(first_name, surname)
      `)
      .eq('plan_id', planId);

    if (error) throw error;

    return (data || []).map(a => ({
      ...a,
      client_name: a.clientes ? `${a.clientes.first_name || ''} ${a.clientes.surname || ''}`.trim() : undefined
    }));
  },

  async getAssignmentByClient(clientId: string): Promise<ClientNutritionAssignment | null> {
    const { data, error } = await supabase
      .from('client_nutrition_assignments')
      .select(`
        *,
        nutrition_plans!plan_id(name, status)
      `)
      .eq('client_id', clientId)
      .maybeSingle();

    if (error) throw error;

    if (!data) return null;

    return {
      ...data,
      plan_name: data.nutrition_plans?.name
    };
  },

  async assignPlanToClient(clientId: string, planId: string, assignedBy: string): Promise<ClientNutritionAssignment> {
    // Upsert to handle reassignment
    const { data, error } = await supabase
      .from('client_nutrition_assignments')
      .upsert({
        client_id: clientId,
        plan_id: planId,
        assigned_by: assignedBy,
        assigned_at: new Date().toISOString()
      }, { onConflict: 'client_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async assignPlanToMultipleClients(clientIds: string[], planId: string, assignedBy: string): Promise<void> {
    const assignments = clientIds.map(clientId => ({
      client_id: clientId,
      plan_id: planId,
      assigned_by: assignedBy,
      assigned_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('client_nutrition_assignments')
      .upsert(assignments, { onConflict: 'client_id' });

    if (error) throw error;
  },

  async unassignClient(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('client_nutrition_assignments')
      .delete()
      .eq('client_id', clientId);

    if (error) throw error;
  },

  // --- CLIENT OVERRIDES ---

  async getOverridesByClient(clientId: string): Promise<ClientNutritionOverride[]> {
    const { data, error } = await supabase
      .from('client_nutrition_overrides')
      .select('*')
      .eq('client_id', clientId);

    if (error) throw error;
    return data || [];
  },

  async getOverrideForRecipe(clientId: string, recipeId: string): Promise<ClientNutritionOverride | null> {
    const { data, error } = await supabase
      .from('client_nutrition_overrides')
      .select('*')
      .eq('client_id', clientId)
      .eq('recipe_id', recipeId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createOrUpdateOverride(override: Partial<ClientNutritionOverride>): Promise<ClientNutritionOverride> {
    const { data, error } = await supabase
      .from('client_nutrition_overrides')
      .upsert({
        client_id: override.client_id,
        recipe_id: override.recipe_id,
        custom_name: override.custom_name,
        custom_ingredients: override.custom_ingredients,
        custom_preparation: override.custom_preparation,
        custom_calories: override.custom_calories,
        notes: override.notes,
        updated_at: new Date().toISOString()
      }, { onConflict: 'client_id,recipe_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteOverride(clientId: string, recipeId: string): Promise<void> {
    const { error } = await supabase
      .from('client_nutrition_overrides')
      .delete()
      .eq('client_id', clientId)
      .eq('recipe_id', recipeId);

    if (error) throw error;
  },

  // --- VERSIONS ---

  async getPlanVersions(planId: string): Promise<NutritionPlanVersion[]> {
    const { data, error } = await supabase
      .from('nutrition_plan_versions')
      .select('*')
      .eq('plan_id', planId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // --- CLIENT PORTAL HELPERS ---

  async getClientPlanWithRecipes(clientId: string): Promise<{
    plan: NutritionPlan | null;
    recipes: NutritionRecipe[];
    overrides: Map<string, ClientNutritionOverride>;
    isAutomatic?: boolean;
    pendingApproval?: boolean;
  }> {
    // 1. Get explicit assignment
    const assignment = await this.getAssignmentByClient(clientId);
    let planId = assignment?.plan_id;
    let isAutomatic = false;

    // 2. If no assignment, look for automatic plan
    if (!planId) {
      // Check nutrition_approved before auto-plan
      const { data: clientData } = await supabase
        .from('clientes')
        .select('nutrition_approved')
        .eq('id', clientId)
        .single();

      if (!clientData?.nutrition_approved) {
        return { plan: null, recipes: [], overrides: new Map(), pendingApproval: true };
      }

      const autoPlan = await this.getAutoPlanForClient(clientId);
      if (autoPlan) {
        planId = autoPlan.id;
        isAutomatic = true;
      }
    }

    if (!planId) {
      return { plan: null, recipes: [], overrides: new Map() };
    }

    // 3. Get plan (only if published)
    const { data: plan } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('id', planId)
      .eq('status', 'published')
      .single();

    if (!plan) {
      return { plan: null, recipes: [], overrides: new Map() };
    }

    // 4. Get recipes
    const recipes = await this.getRecipesByPlan(planId);

    // 5. Get overrides
    const overridesArray = await this.getOverridesByClient(clientId);
    const overrides = new Map<string, ClientNutritionOverride>();
    overridesArray.forEach(o => overrides.set(o.recipe_id, o));

    return { plan, recipes, overrides, isAutomatic };
  },

  // Helper to apply overrides to a recipe
  applyOverride(recipe: NutritionRecipe, override?: ClientNutritionOverride): NutritionRecipe {
    if (!override) return recipe;

    return {
      ...recipe,
      name: override.custom_name || recipe.name,
      ingredients: override.custom_ingredients || recipe.ingredients,
      preparation: override.custom_preparation || recipe.preparation,
      calories: override.custom_calories || recipe.calories
    };
  },

  // --- SEARCH ---

  async searchClients(query: string, limit = 20): Promise<Array<{ id: string; name: string; email: string }>> {
    const { data, error } = await supabase
      .from('clientes')
      .select('id, first_name, surname, email')
      .or(`first_name.ilike.%${query}%,surname.ilike.%${query}%,email.ilike.%${query}%`)
      .eq('status', 'active')
      .limit(limit);

    if (error) throw error;

    return (data || []).map(c => ({
      id: c.id,
      name: `${c.first_name || ''} ${c.surname || ''}`.trim() || 'Sin nombre',
      email: c.property_correo_electr_nico || ''
    }));
  },

  async clonePlan(planId: string, createdBy: string): Promise<NutritionPlan> {
    const originalPlan = await this.getPlanById(planId);
    if (!originalPlan) throw new Error('Plan original no encontrado');
    const originalRecipes = await this.getRecipesByPlan(planId);

    const { data: newPlan, error: planError } = await supabase
      .from('nutrition_plans')
      .insert({
        name: `${originalPlan.name} (Copia)`,
        description: originalPlan.description,
        tags: originalPlan.tags || [],
        target_calories: originalPlan.target_calories,
        diet_type: originalPlan.diet_type,
        target_month: originalPlan.target_month,
        target_fortnight: originalPlan.target_fortnight,
        instructions: originalPlan.instructions,
        intro_content: originalPlan.intro_content,
        breakfast_content: originalPlan.breakfast_content,
        lunch_content: originalPlan.lunch_content,
        dinner_content: originalPlan.dinner_content,
        snack_content: originalPlan.snack_content,
        status: 'draft',
        created_by: createdBy
      })
      .select()
      .single();

    if (planError) throw planError;

    if (originalRecipes.length > 0) {
      const { error: recipesError } = await supabase
        .from('nutrition_recipes')
        .insert(originalRecipes.map(r => ({
          plan_id: newPlan.id,
          category: r.category,
          position: r.position,
          name: r.name,
          ingredients: r.ingredients,
          preparation: r.preparation,
          calories: r.calories,
          protein: r.protein,
          carbs: r.carbs,
          fat: r.fat,
          fiber: r.fiber,
          image_url: r.image_url,
          is_draft: true
        })));
      if (recipesError) throw recipesError;
    }
    return newPlan;
  },

  getFortnightInfo(date: Date = new Date()) {
    const month = date.getMonth() + 1; // 1-12
    const day = date.getDate();
    const fortnight = day <= 15 ? 1 : 2;
    return { month, fortnight };
  },

  async getActivePeriod(): Promise<{ month: number; fortnight: number }> {
    try {
      const { data } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['nutrition_active_month', 'nutrition_active_fortnight']);

      if (data && data.length === 2) {
        const monthSetting = data.find((s: any) => s.setting_key === 'nutrition_active_month');
        const fortnightSetting = data.find((s: any) => s.setting_key === 'nutrition_active_fortnight');
        const month = parseInt(monthSetting?.setting_value || '0');
        const fortnight = parseInt(fortnightSetting?.setting_value || '0');
        if (month >= 1 && month <= 12 && (fortnight === 1 || fortnight === 2)) {
          return { month, fortnight };
        }
      }
    } catch (err) {
      console.error('Error reading active period from app_settings, falling back to date:', err);
    }
    // Fallback to date-based
    return this.getFortnightInfo();
  },

  async advancePeriod(userId: string): Promise<{ month: number; fortnight: number }> {
    const current = await this.getActivePeriod();
    let nextMonth = current.month;
    let nextFortnight = current.fortnight === 1 ? 2 : 1;
    if (nextFortnight === 1) {
      // Moved from Q2 to Q1, so advance month
      nextMonth = current.month === 12 ? 1 : current.month + 1;
    }

    const updates = [
      { setting_key: 'nutrition_active_month', setting_value: String(nextMonth), description: 'Mes activo para asignación automática de nutrición (1-12)' },
      { setting_key: 'nutrition_active_fortnight', setting_value: String(nextFortnight), description: 'Quincena activa para asignación automática (1 o 2)' }
    ];

    const { error } = await supabase
      .from('app_settings')
      .upsert(updates, { onConflict: 'setting_key' });

    if (error) throw error;

    return { month: nextMonth, fortnight: nextFortnight };
  },

  async approveClientNutrition(clientId: string, approvedBy: string): Promise<void> {
    const { error } = await supabase
      .from('clientes')
      .update({
        nutrition_approved: true,
        nutrition_approved_at: new Date().toISOString(),
        nutrition_approved_by: approvedBy
      })
      .eq('id', clientId);

    if (error) throw error;
  },

  async getAutoPlanForClient(identifier: string, explicitCalories?: number): Promise<NutritionPlan | null> {
    let dietType: string | undefined;
    let calories: number | undefined;

    if (explicitCalories !== undefined) {
      // Identifier is dietType in this case
      dietType = identifier;
      calories = explicitCalories;
    } else {
      // Identifier is clientId
      const { data: client, error: clientError } = await supabase
        .from('clientes')
        .select('assigned_nutrition_type, assigned_calories')
        .eq('id', identifier)
        .single();

      if (clientError || !client) return null;
      dietType = client.assigned_nutrition_type;
      calories = client.assigned_calories;
    }

    if (!dietType || !calories) return null;

    const { month, fortnight } = await this.getActivePeriod();

    const { data: plans, error: planError } = await supabase
      .from('nutrition_plans')
      .select('*')
      .eq('status', 'published')
      .eq('diet_type', dietType)
      .eq('target_calories', calories)
      .eq('target_month', month)
      .eq('target_fortnight', fortnight)
      .limit(1);

    if (planError || !plans || plans.length === 0) return null;

    return plans[0];
  }
};

export default nutritionService;
