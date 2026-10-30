import { View, Text, TouchableOpacity, Image, Alert } from "react-native";
import { ChefHat, Flame, Clock, Trash2 } from "lucide-react-native";
import { useTheme } from "../../theme/ThemeProvider";
import { SketchButton } from "../ui/SketchButton";

export function RecipeCard({ recipe, onPress, onDelete, canDelete = true }) {
  const { tokens } = useTheme();

  const ingredientCount = recipe.ingredients?.length || 0;

  const handleDelete = () => {
    Alert.alert(
      "Delete Recipe",
      `Delete "${recipe.title}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete && onDelete(recipe.id),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        backgroundColor: tokens.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderColor: tokens.line,
        borderWidth: 1,
      }}
    >
      {recipe.imageUrl && (
        <Image
          source={{ uri: recipe.imageUrl }}
          style={{
            width: "100%",
            height: 160,
            borderRadius: 8,
            marginBottom: 12,
          }}
        />
      )}

      <Text
        style={{
          fontSize: 18,
          fontWeight: "600",
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
            marginBottom: 10,
            lineHeight: 20,
          }}
          numberOfLines={2}
        >
          {recipe.description}
        </Text>
      )}

      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <View style={{ flexDirection: "row", gap: 16, flex: 1 }}>
          {ingredientCount > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <ChefHat size={16} color={tokens.accent} />
              <Text style={{ fontSize: 12, color: tokens.textDim }}>
                {ingredientCount} ingredients
              </Text>
            </View>
          )}

          {recipe.prepTime && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Clock size={16} color={tokens.accent} />
              <Text style={{ fontSize: 12, color: tokens.textDim }}>
                {recipe.prepTime}m prep
              </Text>
            </View>
          )}

          {recipe.cookTime && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Flame size={16} color={tokens.accent} />
              <Text style={{ fontSize: 12, color: tokens.textDim }}>
                {recipe.cookTime}m cook
              </Text>
            </View>
          )}
        </View>

        {canDelete && (
          <TouchableOpacity
            onPress={handleDelete}
            style={{ padding: 4, marginLeft: 8 }}
          >
            <Trash2 size={18} color={tokens.danger} />
          </TouchableOpacity>
        )}
      </View>

      {recipe.tags && recipe.tags.length > 0 && (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {recipe.tags.slice(0, 3).map((tag, idx) => (
            <View
              key={idx}
              style={{
                backgroundColor: tokens.accent + "20",
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 6,
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: tokens.accent,
                  fontWeight: "500",
                }}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}
