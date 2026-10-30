import {
  View,
  Text,
  ScrollView,
  TextInput,
  Switch,
} from "react-native";
import { X, Plus } from "lucide-react-native";
import { useState } from "react";
import { useTheme } from "../../theme/ThemeProvider";
import { SketchButton as TouchableOpacity } from "../ui/SketchButton";

export function RecipeEditForm({
  initialRecipe,
  onSave,
  onCancel,
  isSaving,
  households = [],
  selectedHouseholdId,
}) {
  const { tokens } = useTheme();
  const [form, setForm] = useState(
    initialRecipe || {
      title: "",
      description: "",
      prepTime: null,
      cookTime: null,
      servings: "",
      ingredients: [],
      instructions: [],
      householdId: selectedHouseholdId || households[0]?.id || "",
    }
  );

  const [newIngredient, setNewIngredient] = useState({
    name: "",
    quantity: "",
    unit: "",
  });

  const [newInstruction, setNewInstruction] = useState("");

  const handleSave = () => {
    if (!form.title.trim()) {
      alert("Please enter a recipe title");
      return;
    }

    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      householdId: form.householdId || selectedHouseholdId || households[0]?.id,
    });
  };

  const addIngredient = () => {
    if (!newIngredient.name.trim()) return;

    setForm((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          name: newIngredient.name.trim(),
          quantity: newIngredient.quantity ? parseFloat(newIngredient.quantity) : undefined,
          unit: newIngredient.unit || undefined,
        },
      ],
    }));

    setNewIngredient({ name: "", quantity: "", unit: "" });
  };

  const removeIngredient = (idx) => {
    setForm((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== idx),
    }));
  };

  const addInstruction = () => {
    if (!newInstruction.trim()) return;

    setForm((prev) => ({
      ...prev,
      instructions: [...prev.instructions, newInstruction.trim()],
    }));

    setNewInstruction("");
  };

  const removeInstruction = (idx) => {
    setForm((prev) => ({
      ...prev,
      instructions: prev.instructions.filter((_, i) => i !== idx),
    }));
  };

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 80 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: tokens.textDim,
              marginBottom: 6,
            }}
          >
            Recipe Title *
          </Text>
          <TextInput
            placeholder="Enter recipe title"
            placeholderTextColor={tokens.textDim}
            value={form.title}
            onChangeText={(text) => setForm((prev) => ({ ...prev, title: text }))}
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.line,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: tokens.text,
              fontSize: 14,
            }}
          />
        </View>

        {/* Description */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: tokens.textDim,
              marginBottom: 6,
            }}
          >
            Description
          </Text>
          <TextInput
            placeholder="Optional description..."
            placeholderTextColor={tokens.textDim}
            value={form.description}
            onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))}
            multiline
            numberOfLines={3}
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.line,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: tokens.text,
              fontSize: 14,
              textAlignVertical: "top",
            }}
          />
        </View>

        {/* Household */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: tokens.textDim,
              marginBottom: 8,
            }}
          >
            Household
          </Text>
          {households.length > 1 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {households.map((household) => {
                const isSelected = (form.householdId || selectedHouseholdId) === household.id;
                return (
                  <TouchableOpacity
                    key={household.id}
                    onPress={() => setForm((prev) => ({ ...prev, householdId: household.id }))}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 8,
                      borderWidth: 1,
                      borderColor: isSelected ? tokens.accent : tokens.line,
                      backgroundColor: isSelected ? tokens.accent : tokens.surface,
                    }}
                  >
                    <Text style={{ color: isSelected ? tokens.onAccent : tokens.text }}>
                      {household.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={{ color: tokens.text }}>
              {households[0]?.name || ""}
            </Text>
          )}
        </View>

        {/* Times & Servings */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: tokens.textDim,
              marginBottom: 8,
            }}
          >
            Timing & Servings
          </Text>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: tokens.textDim,
                  marginBottom: 4,
                }}
              >
                Prep (min)
              </Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={tokens.textDim}
                value={form.prepTime?.toString() || ""}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, prepTime: text ? parseInt(text) : null }))
                }
                keyboardType="number-pad"
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.line,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: tokens.text,
                  fontSize: 14,
                }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: tokens.textDim,
                  marginBottom: 4,
                }}
              >
                Cook (min)
              </Text>
              <TextInput
                placeholder="0"
                placeholderTextColor={tokens.textDim}
                value={form.cookTime?.toString() || ""}
                onChangeText={(text) =>
                  setForm((prev) => ({ ...prev, cookTime: text ? parseInt(text) : null }))
                }
                keyboardType="number-pad"
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.line,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: tokens.text,
                  fontSize: 14,
                }}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  color: tokens.textDim,
                  marginBottom: 4,
                }}
              >
                Servings
              </Text>
              <TextInput
                placeholder="2"
                placeholderTextColor={tokens.textDim}
                value={form.servings}
                onChangeText={(text) => setForm((prev) => ({ ...prev, servings: text }))}
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.line,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: tokens.text,
                  fontSize: 14,
                }}
              />
            </View>
          </View>
        </View>

        {/* Ingredients */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: tokens.textDim,
              marginBottom: 8,
            }}
          >
            Ingredients
          </Text>

          {form.ingredients.map((ingredient, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 8,
                alignItems: "center",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 12,
                    color: tokens.textDim,
                    marginBottom: 4,
                  }}
                >
                  {ingredient.quantity && ingredient.unit
                    ? `${ingredient.quantity} ${ingredient.unit}`
                    : ingredient.quantity
                    ? ingredient.quantity.toString()
                    : ""}
                </Text>
                <Text
                  style={{
                    fontSize: 14,
                    color: tokens.text,
                    fontWeight: "500",
                  }}
                >
                  {ingredient.name}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => removeIngredient(idx)}
                style={{
                  padding: 6,
                }}
              >
                <X size={18} color={tokens.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Ingredient */}
          <View
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.line,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              marginTop: 8,
            }}
          >
            <View style={{ flexDirection: "row", gap: 8, marginBottom: 8 }}>
              <TextInput
                placeholder="Quantity"
                placeholderTextColor={tokens.textDim}
                value={newIngredient.quantity}
                onChangeText={(text) =>
                  setNewIngredient((prev) => ({ ...prev, quantity: text }))
                }
                keyboardType="decimal-pad"
                style={{
                  flex: 0.3,
                  backgroundColor: tokens.bg,
                  borderColor: tokens.line,
                  borderWidth: 1,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  color: tokens.text,
                  fontSize: 12,
                }}
              />

              <TextInput
                placeholder="Unit"
                placeholderTextColor={tokens.textDim}
                value={newIngredient.unit}
                onChangeText={(text) =>
                  setNewIngredient((prev) => ({ ...prev, unit: text }))
                }
                style={{
                  flex: 0.3,
                  backgroundColor: tokens.bg,
                  borderColor: tokens.line,
                  borderWidth: 1,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  color: tokens.text,
                  fontSize: 12,
                }}
              />

              <TextInput
                placeholder="Ingredient name"
                placeholderTextColor={tokens.textDim}
                value={newIngredient.name}
                onChangeText={(text) =>
                  setNewIngredient((prev) => ({ ...prev, name: text }))
                }
                style={{
                  flex: 1,
                  backgroundColor: tokens.bg,
                  borderColor: tokens.line,
                  borderWidth: 1,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 8,
                  color: tokens.text,
                  fontSize: 12,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={addIngredient}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 8,
              }}
            >
              <Plus size={16} color={tokens.accent} />
              <Text style={{ color: tokens.accent, fontWeight: "600", fontSize: 12 }}>
                Add Ingredient
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Instructions */}
        <View style={{ marginBottom: 16 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: tokens.textDim,
              marginBottom: 8,
            }}
          >
            Instructions
          </Text>

          {form.instructions.map((instruction, idx) => (
            <View
              key={idx}
              style={{
                flexDirection: "row",
                gap: 8,
                marginBottom: 8,
                alignItems: "flex-start",
              }}
            >
              <View
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: tokens.accent,
                  justifyContent: "center",
                  alignItems: "center",
                  marginTop: 2,
                }}
              >
                <Text
                  style={{
                    color: tokens.onAccent,
                    fontWeight: "600",
                    fontSize: 12,
                  }}
                >
                  {idx + 1}
                </Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: tokens.text,
                    lineHeight: 20,
                  }}
                >
                  {instruction}
                </Text>
              </View>

              <TouchableOpacity onPress={() => removeInstruction(idx)}>
                <X size={18} color={tokens.danger} />
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Instruction */}
          <View
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.line,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              marginTop: 8,
            }}
          >
            <TextInput
              placeholder="Enter cooking instruction..."
              placeholderTextColor={tokens.textDim}
              value={newInstruction}
              onChangeText={setNewInstruction}
              multiline
              numberOfLines={2}
              style={{
                backgroundColor: tokens.bg,
                borderColor: tokens.line,
                borderWidth: 1,
                borderRadius: 6,
                paddingHorizontal: 8,
                paddingVertical: 8,
                color: tokens.text,
                fontSize: 12,
                marginBottom: 8,
                textAlignVertical: "top",
              }}
            />

            <TouchableOpacity
              onPress={addInstruction}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                paddingVertical: 8,
              }}
            >
              <Plus size={16} color={tokens.accent} />
              <Text style={{ color: tokens.accent, fontWeight: "600", fontSize: 12 }}>
                Add Step
              </Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Action Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: tokens.surface,
          borderTopColor: tokens.line,
          borderTopWidth: 1,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={onCancel}
          style={{
            flex: 1,
            borderColor: tokens.line,
            borderWidth: 1,
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: tokens.text, fontWeight: "600" }}>Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={{
            flex: 1,
            backgroundColor: tokens.accent,
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: "center",
            opacity: isSaving ? 0.7 : 1,
          }}
        >
          <Text style={{ color: tokens.onAccent, fontWeight: "600" }}>
            {isSaving ? "Saving..." : "Save Recipe"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
