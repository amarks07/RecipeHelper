import {
  View,
  Text,
  ScrollView,
  Image,
} from "react-native";
import { ChevronLeft, Edit2, Trash2, Clock, Flame } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { PushableButton as TouchableOpacity } from "../ui/PushableButton";

export function RecipeDetailView({
  recipe,
  onClose,
  onEdit,
  onDelete,
  canManage = true,
}) {
  const { tokens } = useTheme();

  if (!recipe) {
    return (
      <View style={{ flex: 1, backgroundColor: tokens.bg, justifyContent: "center", alignItems: "center" }}>
        <Text style={{ color: tokens.textDim }}>Recipe not found</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: tokens.surface,
          borderBottomColor: tokens.line,
          borderBottomWidth: 1,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={onClose}>
          <ChevronLeft size={24} color={tokens.text} />
        </TouchableOpacity>
        {canManage && (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={onEdit}>
              <Edit2 size={20} color={tokens.accent} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onDelete}>
              <Trash2 size={20} color={tokens.danger} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Image */}
        {(recipe.imageDisplayUrl || recipe.imageUrl) && (
          <Image
            source={{ uri: recipe.imageDisplayUrl || recipe.imageUrl }}
            style={{ width: "100%", height: 240 }}
          />
        )}

        {/* Title */}
        <View style={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 28,
              fontWeight: "700",
              color: tokens.text,
              marginBottom: 8,
            }}
          >
            {recipe.title}
          </Text>

          {recipe.description && (
            <Text
              style={{
                fontSize: 14,
                color: tokens.textDim,
                lineHeight: 20,
                marginBottom: 12,
              }}
            >
              {recipe.description}
            </Text>
          )}

          {/* Metadata */}
          <View
            style={{
              flexDirection: "row",
              gap: 16,
              paddingBottom: 16,
              borderBottomColor: tokens.line,
              borderBottomWidth: 1,
            }}
          >
            {recipe.servings && (
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: tokens.textDim,
                    marginBottom: 4,
                  }}
                >
                  Servings
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: tokens.text,
                  }}
                >
                  {recipe.servings}
                </Text>
              </View>
            )}

            {recipe.prepTime && (
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: tokens.textDim,
                    marginBottom: 4,
                  }}
                >
                  Prep Time
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Clock size={16} color={tokens.accent} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: tokens.text,
                    }}
                  >
                    {recipe.prepTime}m
                  </Text>
                </View>
              </View>
            )}

            {recipe.cookTime && (
              <View>
                <Text
                  style={{
                    fontSize: 12,
                    color: tokens.textDim,
                    marginBottom: 4,
                  }}
                >
                  Cook Time
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <Flame size={16} color={tokens.accent} />
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: tokens.text,
                    }}
                  >
                    {recipe.cookTime}m
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* Ingredients */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: tokens.text,
                marginBottom: 12,
              }}
            >
              Ingredients
            </Text>
            {recipe.ingredients.map((ingredient, idx) => (
              <View
                key={idx}
                style={{
                  paddingVertical: 10,
                  borderBottomColor: tokens.line,
                  borderBottomWidth: idx < recipe.ingredients.length - 1 ? 1 : 0,
                }}
              >
                <Text style={{ color: tokens.text, fontSize: 14, lineHeight: 20 }}>
                  {ingredient.quantity && (
                    <Text style={{ fontWeight: "600" }}>{ingredient.quantity}</Text>
                  )}
                  {ingredient.quantity && ingredient.unit && " "}
                  {ingredient.unit && (
                    <Text style={{ fontWeight: "600" }}>{ingredient.unit}</Text>
                  )}
                  {(ingredient.quantity || ingredient.unit) && " "}
                  {ingredient.name}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Instructions */}
        {recipe.instructions && recipe.instructions.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "700",
                color: tokens.text,
                marginBottom: 12,
              }}
            >
              Instructions
            </Text>
            {recipe.instructions.map((instruction, idx) => (
              <View
                key={idx}
                style={{
                  paddingVertical: 12,
                  flexDirection: "row",
                  gap: 12,
                  borderBottomColor: tokens.line,
                  borderBottomWidth: idx < recipe.instructions.length - 1 ? 1 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: tokens.accent,
                    minWidth: 24,
                  }}
                >
                  {idx + 1}
                </Text>
                <Text
                  style={{
                    flex: 1,
                    fontSize: 14,
                    color: tokens.text,
                    lineHeight: 20,
                  }}
                >
                  {instruction}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 16 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: tokens.textDim,
                marginBottom: 8,
              }}
            >
              Tags
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {recipe.tags.map((tag, idx) => (
                <View
                  key={idx}
                  style={{
                    backgroundColor: tokens.accent + "20",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: tokens.accent,
                      fontWeight: "500",
                    }}
                  >
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
