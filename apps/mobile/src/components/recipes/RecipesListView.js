import { View, Text, FlatList, TextInput, TouchableOpacity } from "react-native";
import { Search, Plus, Camera } from "lucide-react-native";
import { useState, useMemo } from "react";
import { RecipeCard } from "./RecipeCard";
import { useTheme } from "../../theme/ThemeProvider";

export function RecipesListView({
  recipes,
  onAddRecipe,
  onSelectRecipe,
  onDeleteRecipe,
  onStartOCR,
}) {
  const { tokens } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);

  // Get all unique tags from recipes
  const allTags = useMemo(() => {
    const tags = new Set();
    recipes?.forEach((recipe) => {
      recipe.tags?.forEach((tag) => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [recipes]);

  // Filter recipes by search and tags
  const filteredRecipes = useMemo(() => {
    return (recipes || []).filter((recipe) => {
      const matchesSearch =
        !searchQuery ||
        recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recipe.ingredients?.some((ing) =>
          ing.name.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.every((tag) => recipe.tags?.includes(tag));

      return matchesSearch && matchesTags;
    });
  }, [recipes, searchQuery, selectedTags]);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg }}>
      {/* Header */}
      <View
        style={{
          backgroundColor: tokens.surface,
          padding: 16,
          borderBottomColor: tokens.line,
          borderBottomWidth: 1,
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "700",
            color: tokens.text,
            marginBottom: 12,
          }}
        >
          Recipes
        </Text>

        {/* Search Bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: tokens.bg,
            borderColor: tokens.line,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 12,
            gap: 8,
          }}
        >
          <Search size={18} color={tokens.textDim} />
          <TextInput
            placeholder="Search recipes..."
            placeholderTextColor={tokens.textDim}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              paddingVertical: 10,
              color: tokens.text,
              fontSize: 14,
            }}
          />
        </View>
      </View>

      {/* Tag Filter */}
      {allTags.length > 0 && (
        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 12,
            backgroundColor: tokens.surface,
            borderBottomColor: tokens.line,
            borderBottomWidth: 1,
          }}
        >
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={allTags}
            keyExtractor={(tag) => tag}
            renderItem={({ item: tag }) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <TouchableOpacity
                  onPress={() => {
                    if (isSelected) {
                      setSelectedTags(selectedTags.filter((t) => t !== tag));
                    } else {
                      setSelectedTags([...selectedTags, tag]);
                    }
                  }}
                  style={{
                    backgroundColor: isSelected
                      ? tokens.accent
                      : tokens.bg,
                    borderColor: tokens.accent,
                    borderWidth: 1,
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    marginRight: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: isSelected ? tokens.onAccent : tokens.accent,
                      fontWeight: "500",
                    }}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            }}
            scrollEventThrottle={16}
          />
        </View>
      )}

      {/* Recipe List */}
      {filteredRecipes.length === 0 ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: tokens.textDim,
              textAlign: "center",
            }}
          >
            {recipes?.length === 0
              ? "No recipes yet. Create one to get started!"
              : "No recipes match your search."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecipes}
          keyExtractor={(recipe) => recipe.id}
          renderItem={({ item: recipe }) => (
            <RecipeCard
              recipe={recipe}
              onPress={() => onSelectRecipe(recipe.id)}
              onDelete={() => onDeleteRecipe(recipe.id)}
            />
          )}
          contentContainerStyle={{
            padding: 16,
            paddingBottom: 100,
          }}
          scrollEventThrottle={16}
        />
      )}

      {/* Floating Action Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 20,
          right: 20,
          gap: 12,
        }}
      >
        {/* OCR Button */}
        <TouchableOpacity
          onPress={onStartOCR}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: tokens.accent,
            justifyContent: "center",
            alignItems: "center",
            elevation: 4,
            shadowColor: tokens.accent,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
          }}
        >
          <Camera size={24} color={tokens.onAccent} />
        </TouchableOpacity>

        {/* Add Recipe Button */}
        <TouchableOpacity
          onPress={onAddRecipe}
          style={{
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: tokens.surface,
            borderColor: tokens.accent,
            borderWidth: 2,
            justifyContent: "center",
            alignItems: "center",
            elevation: 4,
            shadowColor: tokens.text,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
          }}
        >
          <Plus size={24} color={tokens.accent} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
