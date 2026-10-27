import { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView, Image } from "react-native";
import { supabase } from "@recipehelper/core";
import { mergeOCRResults, validateMergedRecipe } from "@recipehelper/core/src/recipe-ocr";
import { useTheme } from "../../theme/ThemeProvider";

/**
 * Process multiple images sequentially through OCR
 * Shows progress as each image is processed
 */
export function OCRProcessingScreen({ navigation, route }) {
  const { images } = route.params || {};
  const { tokens } = useTheme();
  const [progress, setProgress] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const [ocrResults, setOcrResults] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!images || images.length === 0) {
      setError("No images provided");
      return;
    }

    processImages();
  }, []);

  const processImages = async () => {
    try {
      const results = [];

      for (let i = 0; i < images.length; i++) {
        setCurrentImageIndex(i);
        setStatus(`Processing image ${i + 1} of ${images.length}...`);
        setProgress((i / images.length) * 100);

        const image = images[i];

        try {
          // Call OCR processing Edge Function
          const { data, error: ocrError } = await supabase.functions.invoke(
            "ocr-process",
            {
              body: {
                imageUrl: image.uri,
                // In production, would upload to S3 first and pass presigned URL
              },
            }
          );

          console.log(`OCR Response for image ${i + 1}:`, { data, error: ocrError });

          if (ocrError) throw ocrError;

          if (!data) {
            console.warn(`No data returned for image ${i + 1}`);
            continue;
          }

          results.push(data);
          setOcrResults([...results]);
        } catch (imgError) {
          console.error(`Failed to process image ${i + 1}:`, imgError);
          // Continue with next image even if one fails
        }
      }

      if (results.length === 0) {
        throw new Error("Failed to process any images with OCR");
      }

      // Merge all results
      setStatus("Merging results...");
      const merged = mergeOCRResults(results);
      const validation = validateMergedRecipe(merged);

      setProgress(100);
      setStatus("Complete!");

      // Navigate to review screen
      setTimeout(() => {
        navigation.replace("OCRReview", {
          mergedRecipe: merged,
          validation,
          imageCount: images.length,
          images, // Pass images so they can be viewed in review screen
        });
      }, 500);
    } catch (err) {
      console.error("OCR processing failed:", err);
      setError(err.message || "Failed to process images");
    }
  };

  if (error) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: tokens.bg,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: tokens.danger,
            textAlign: "center",
            marginBottom: 16,
          }}
        >
          Processing Failed
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: tokens.textDim,
            textAlign: "center",
            marginBottom: 20,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            backgroundColor: tokens.accent,
            paddingHorizontal: 20,
            paddingVertical: 10,
            borderRadius: 6,
          }}
        >
          <Text style={{ color: tokens.onAccent, fontWeight: "600" }}>
            Go Back
          </Text>
        </TouchableOpacity>
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
        }}
      >
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            color: tokens.text,
          }}
        >
          Processing Images
        </Text>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Current Image Preview */}
        {images && images[currentImageIndex] && (
          <Image
            source={{ uri: images[currentImageIndex].uri }}
            style={{
              width: 120,
              height: 120,
              borderRadius: 12,
              marginBottom: 24,
              borderColor: tokens.accent,
              borderWidth: 2,
            }}
          />
        )}

        {/* Progress Indicator */}
        <ActivityIndicator size="large" color={tokens.accent} />

        {/* Status Text */}
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: tokens.text,
            marginTop: 20,
            textAlign: "center",
          }}
        >
          {status}
        </Text>

        {/* Progress Bar */}
        <View
          style={{
            width: "100%",
            height: 6,
            backgroundColor: tokens.line,
            borderRadius: 3,
            marginTop: 16,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              height: "100%",
              width: `${progress}%`,
              backgroundColor: tokens.accent,
              borderRadius: 3,
              transition: "width 0.3s ease",
            }}
          />
        </View>

        {/* Progress Text */}
        <Text
          style={{
            fontSize: 12,
            color: tokens.textDim,
            marginTop: 8,
            textAlign: "center",
          }}
        >
          {Math.round(progress)}%
        </Text>

        {/* Results So Far */}
        {ocrResults.length > 0 && (
          <View
            style={{
              marginTop: 24,
              width: "100%",
              backgroundColor: tokens.surface,
              borderColor: tokens.line,
              borderWidth: 1,
              borderRadius: 8,
              padding: 12,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "600",
                color: tokens.textDim,
                marginBottom: 8,
              }}
            >
              Extracted So Far:
            </Text>
            {ocrResults.map((result, idx) => (
              <Text
                key={idx}
                style={{
                  fontSize: 11,
                  color: tokens.text,
                  marginBottom: idx < ocrResults.length - 1 ? 4 : 0,
                }}
              >
                Image {idx + 1}: {result.ingredients?.length || 0} ingredients,{" "}
                {result.instructions?.length || 0} instructions
              </Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// Add missing import
import { TouchableOpacity } from "react-native";
