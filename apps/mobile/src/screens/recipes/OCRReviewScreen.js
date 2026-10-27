import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Image,
  Dimensions,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ChevronLeft, AlertCircle, X } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppState } from "../../state/AppStateProvider";
import { useRecipeActions } from "@recipehelper/core";
import { useTheme } from "../../theme/ThemeProvider";

/**
 * Review and edit merged OCR results before saving
 * User can correct errors and adjust recipe details
 */
export function OCRReviewScreen({ navigation, route }) {
  const { mergedRecipe, validation, imageCount, images } = route.params || {};
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const { recipes, setRecipes } = useAppState();
  const { createRecipe } = useRecipeActions(recipes, setRecipes);
  const [isSaving, setIsSaving] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const screenWidth = Dimensions.get("window").width;

  const [editedRecipe, setEditedRecipe] = useState({
    title: mergedRecipe?.title || "",
    description: "",
    ingredients: mergedRecipe?.ingredients || [],
    instructions: mergedRecipe?.instructions || [],
    tags: [],
    prepTime: mergedRecipe?.prepTime,
    cookTime: mergedRecipe?.cookTime,
    servings: mergedRecipe?.servings,
  });

  const [editMode, setEditMode] = useState(null); // 'title', 'ingredient-N', 'instruction-N', etc.

  const handleSaveRecipe = async () => {
    if (!editedRecipe.title.trim()) {
      Alert.alert("Title required", "Please enter a recipe title");
      return;
    }

    setIsSaving(true);
    try {
      await createRecipe(editedRecipe);
      Alert.alert("Success", "Recipe saved successfully!");
      navigation.navigate("RecipeList");
    } catch (error) {
      console.error("Failed to save recipe:", error);
      Alert.alert("Error", "Failed to save recipe. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, backgroundColor: tokens.bg }}
    >
      <View style={{ flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top }}>
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
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <ChevronLeft size={24} color={tokens.text} />
          </TouchableOpacity>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: tokens.text,
            }}
          >
            Review Recipe
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 16, paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Tiles */}
        {images && images.length > 0 && (
          <View style={{ marginBottom: 20 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: tokens.textDim,
                marginBottom: 8,
              }}
            >
              Source Images ({images.length})
            </Text>
            <View style={{ flexDirection: "row", gap: 12, flexWrap: "wrap" }}>
              {images.map((image, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    setSelectedImageIndex(idx);
                    setImageViewerVisible(true);
                  }}
                  style={{
                    backgroundColor: tokens.surface,
                    borderColor: tokens.line,
                    borderWidth: 1,
                    borderRadius: 8,
                    overflow: "hidden",
                    width: (screenWidth - 40) / 2,
                    aspectRatio: 3 / 4,
                  }}
                >
                  <Image
                    source={{ uri: image.uri }}
                    style={{ width: "100%", height: "100%" }}
                  />
                  <View
                    style={{
                      position: "absolute",
                      bottom: 0,
                      left: 0,
                      right: 0,
                      backgroundColor: "rgba(0, 0, 0, 0.6)",
                      padding: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#fff",
                        textAlign: "center",
                      }}
                    >
                      Tap to view
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Confidence Banner */}
        {validation && validation.issues.length > 0 && (
          <View
            style={{
              backgroundColor: tokens.accent + "20",
              borderColor: tokens.accent,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
              marginBottom: 16,
              flexDirection: "row",
              gap: 8,
            }}
          >
            <AlertCircle size={18} color={tokens.accent} />
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: tokens.accent,
                  marginBottom: 4,
                }}
              >
                Review Recommended
              </Text>
              {validation.issues.map((issue, idx) => (
                <Text
                  key={idx}
                  style={{
                    fontSize: 11,
                    color: tokens.accent,
                    marginBottom: idx < validation.issues.length - 1 ? 2 : 0,
                  }}
                >
                  • {issue}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Image Count Info */}
        <Text
          style={{
            fontSize: 12,
            color: tokens.textDim,
            marginBottom: 16,
            fontStyle: "italic",
          }}
        >
          Merged from {imageCount} screenshot{imageCount > 1 ? "s" : ""} • Confidence: {Math.round((mergedRecipe?.confidence || 0) * 100)}%
        </Text>

        {/* Title Section */}
        <View style={{ marginBottom: 20 }}>
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
            value={editedRecipe.title}
            onChangeText={(text) =>
              setEditedRecipe((prev) => ({ ...prev, title: text }))
            }
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.line,
              borderWidth: 1,
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 10,
              color: tokens.text,
              fontSize: 14,
              fontWeight: "600",
            }}
          />
        </View>

        {/* Ingredients Section */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: tokens.textDim,
              marginBottom: 8,
            }}
          >
            Ingredients ({editedRecipe.ingredients.length})
          </Text>

          {editedRecipe.ingredients.length === 0 ? (
            <Text
              style={{
                fontSize: 13,
                color: tokens.textDim,
                fontStyle: "italic",
              }}
            >
              No ingredients detected. You'll need to add them manually.
            </Text>
          ) : (
            editedRecipe.ingredients.map((ingredient, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.line,
                  borderWidth: 1,
                  borderRadius: 6,
                  padding: 10,
                  marginBottom: 8,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 12,
                        color: tokens.textDim,
                        marginBottom: 2,
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
                        fontSize: 13,
                        color: tokens.text,
                        fontWeight: "500",
                      }}
                    >
                      {ingredient.name}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setEditedRecipe((prev) => ({
                        ...prev,
                        ingredients: prev.ingredients.filter((_, i) => i !== idx),
                      }));
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        color: tokens.danger,
                        fontWeight: "600",
                      }}
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Instructions Section */}
        <View style={{ marginBottom: 20 }}>
          <Text
            style={{
              fontSize: 14,
              fontWeight: "600",
              color: tokens.textDim,
              marginBottom: 8,
            }}
          >
            Instructions ({editedRecipe.instructions.length})
          </Text>

          {editedRecipe.instructions.length === 0 ? (
            <Text
              style={{
                fontSize: 13,
                color: tokens.textDim,
                fontStyle: "italic",
              }}
            >
              No instructions detected. You'll need to add them manually.
            </Text>
          ) : (
            editedRecipe.instructions.map((instruction, idx) => (
              <View
                key={idx}
                style={{
                  backgroundColor: tokens.surface,
                  borderColor: tokens.line,
                  borderWidth: 1,
                  borderRadius: 6,
                  padding: 10,
                  marginBottom: 8,
                  flexDirection: "row",
                  gap: 8,
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
                  }}
                >
                  <Text
                    style={{
                      color: tokens.onAccent,
                      fontWeight: "600",
                      fontSize: 11,
                    }}
                  >
                    {idx + 1}
                  </Text>
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      color: tokens.text,
                      lineHeight: 18,
                    }}
                  >
                    {instruction}
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setEditedRecipe((prev) => ({
                      ...prev,
                      instructions: prev.instructions.filter(
                        (_, i) => i !== idx
                      ),
                    }));
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: tokens.danger,
                      fontWeight: "600",
                    }}
                  >
                    Remove
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Info about manual entry */}
        <Text
          style={{
            fontSize: 12,
            color: tokens.textDim,
            fontStyle: "italic",
            marginTop: 16,
          }}
        >
          💡 To edit ingredients and instructions in detail, you can save this recipe and edit it on the recipe detail screen.
        </Text>
        </ScrollView>

        {/* Image Viewer Modal */}
        <Modal
          visible={imageViewerVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setImageViewerVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: "#000" }}>
            {/* Close Button */}
            <View
              style={{
                position: "absolute",
                top: insets.top + 12,
                right: 12,
                zIndex: 10,
              }}
            >
              <TouchableOpacity
                onPress={() => setImageViewerVisible(false)}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  borderRadius: 24,
                  padding: 8,
                }}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Image */}
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 16,
              }}
            >
              <Image
                source={{ uri: images[selectedImageIndex]?.uri }}
                style={{
                  width: "100%",
                  height: "100%",
                  resizeMode: "contain",
                }}
              />
            </View>

            {/* Counter */}
            <View
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.7)",
                paddingVertical: 12,
                paddingHorizontal: 16,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontSize: 14 }}>
                Image {selectedImageIndex + 1} of {images.length}
              </Text>
            </View>
          </View>
        </Modal>

      {/* Action Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: insets.bottom,
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
          onPress={() => navigation.goBack()}
          style={{
            flex: 1,
            borderColor: tokens.line,
            borderWidth: 1,
            borderRadius: 8,
            paddingVertical: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: tokens.text, fontWeight: "600" }}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleSaveRecipe}
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
    </KeyboardAvoidingView>
  );
}
