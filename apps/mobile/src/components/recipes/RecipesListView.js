import { View, Text, FlatList, TextInput, Modal } from "react-native";
import { ChevronDown, Search, Plus, Camera } from "lucide-react-native";
import { useState, useMemo } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RecipeCard } from "./RecipeCard";
import { RecipeBookshelf } from "./RecipeBookshelf";
import { useTheme } from "../../theme/ThemeProvider";
import { PushableButton as TouchableOpacity } from "../ui/PushableButton";

export function RecipesListView({
  recipes,
  onAddRecipe,
  onSelectRecipe,
  onDeleteRecipe,
  onStartOCR,
  households = [],
  selectedHouseholdId,
  onSelectHousehold,
  currentUserId,
}) {
  const insets = useSafeAreaInsets();
  const { tokens } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [householdPickerVisible, setHouseholdPickerVisible] = useState(false);

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

      const matchesHousehold =
        !selectedHouseholdId || recipe.householdId === selectedHouseholdId;

      return matchesSearch && matchesTags && matchesHousehold;
    });
  }, [recipes, searchQuery, selectedTags, selectedHouseholdId]);

  return (
    <View style={{ flex: 1, backgroundColor: tokens.bg, paddingTop: insets.top }}>
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
            fontSize: 36,
            fontWeight: "400",
            fontFamily: "FingerPaint",
            color: tokens.accent,
            marginBottom: 12,
          }}
        >
          nibble
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
          {households.length > 1 && (
            <TouchableOpacity
              onPress={() => setHouseholdPickerVisible(true)}
              accessibilityRole="button"
              accessibilityLabel="Filter recipes by household"
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingRight: 8,
                borderRightColor: tokens.line,
                borderRightWidth: 1,
              }}
            >
              <Text
                numberOfLines={1}
                style={{ color: tokens.text, fontSize: 13, maxWidth: 110 }}
              >
                {households.find((household) => household.id === selectedHouseholdId)?.name || "All"}
              </Text>
              <ChevronDown size={16} color={tokens.textDim} />
            </TouchableOpacity>
          )}
          <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 8 }}>
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
      </View>

      <Modal
        visible={householdPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHouseholdPickerVisible(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setHouseholdPickerVisible(false)}
          style={{
            flex: 1,
            justifyContent: "center",
            padding: 24,
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        >
          <View
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.line,
              borderWidth: 1,
              borderRadius: 12,
              padding: 8,
            }}
          >
            {[{ id: "", name: "All households" }, ...households].map((household) => (
              <TouchableOpacity
                key={household.id || "all"}
                onPress={() => {
                  onSelectHousehold(household.id);
                  setHouseholdPickerVisible(false);
                }}
                style={{ padding: 14 }}
              >
                <Text
                  style={{
                    color: selectedHouseholdId === household.id ? tokens.accent : tokens.text,
                    fontWeight: selectedHouseholdId === household.id ? "700" : "400",
                  }}
                >
                  {household.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

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
            renderItem={({ item: tag, index }) => {
              const isSelected = selectedTags.includes(tag);
              const tagColor = tokens.palette[index % tokens.palette.length];
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
                    borderColor: isSelected ? tokens.accent : tagColor,
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
                      color: isSelected ? tokens.onAccent : tagColor,
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
      <FlatList
        data={filteredRecipes}
        keyExtractor={(recipe) => recipe.id}
        renderItem={({ item: recipe }) => (
          <RecipeCard
            recipe={recipe}
            canDelete={recipe.userId === currentUserId}
            onPress={() => onSelectRecipe(recipe.id)}
            onDelete={() => onDeleteRecipe(recipe.id)}
          />
        )}
        ListEmptyComponent={
          <View
            style={{
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
        }
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 170 + insets.bottom,
          flexGrow: 1,
        }}
        scrollEventThrottle={16}
      />

      <RecipeBookshelf
        recipes={recipes}
        onSelectRecipe={onSelectRecipe}
        tokens={tokens}
        bottomInset={insets.bottom}
      />

      {/* Floating Action Buttons */}
      <View
        style={{
          position: "absolute",
          bottom: 152 + insets.bottom,
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
