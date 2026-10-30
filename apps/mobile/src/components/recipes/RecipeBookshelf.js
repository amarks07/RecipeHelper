import { ScrollView, Text, TouchableOpacity, View } from "react-native";

export function RecipeBookshelf({ recipes, onSelectRecipe, tokens, bottomInset = 0 }) {
  if (!recipes?.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: bottomInset,
      }}
      contentContainerStyle={{
        alignItems: "flex-end",
        gap: 5,
        paddingHorizontal: 4,
      }}
    >
      {recipes.map((recipe, index) => {
        const bookColor = tokens.palette[index % tokens.palette.length];
        return (
          <TouchableOpacity
            key={recipe.id}
            onPress={() => onSelectRecipe(recipe.id)}
            accessibilityRole="button"
            accessibilityLabel={`Open recipe ${recipe.title}`}
            style={{
              width: 38,
              height: 126 + (index % 3) * 7,
              justifyContent: "space-between",
              overflow: "hidden",
              borderLeftColor: "rgba(0,0,0,0.2)",
              borderLeftWidth: 4,
              borderTopColor: "rgba(255,255,255,0.5)",
              borderTopWidth: 2,
              borderRadius: 4,
              backgroundColor: bookColor,
              elevation: 2,
            }}
          >
            <View
              style={{
                height: 1,
                backgroundColor: "rgba(255,255,255,0.55)",
                marginTop: 4,
              }}
            />
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <Text
                numberOfLines={1}
                style={{
                  width: 108,
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: "700",
                  textAlign: "center",
                  textShadowColor: "rgba(0,0,0,0.25)",
                  textShadowOffset: { width: 0, height: 1 },
                  textShadowRadius: 2,
                  transform: [{ rotate: "-90deg" }],
                }}
              >
                {recipe.title}
              </Text>
            </View>
            <View
              style={{
                height: 1,
                backgroundColor: "rgba(255,255,255,0.55)",
                marginBottom: 4,
              }}
            />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}
