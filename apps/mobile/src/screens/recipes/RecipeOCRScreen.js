import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { Camera, Image as ImageIcon, ChevronLeft, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../theme/ThemeProvider";

/**
 * Multi-image selection screen for recipe capture
 * Users can select multiple screenshots of a recipe
 * Order matters: first image usually has title
 */
export function RecipeOCRScreen({ navigation, onProceed }) {
  const { tokens } = useTheme();
  const cameraRef = useRef(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [activeTab, setActiveTab] = useState("gallery"); // 'camera' or 'gallery'

  const pickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultiple: true,
      quality: 0.9,
      aspect: [4, 3],
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => ({
        id: `${Date.now()}_${Math.random()}`,
        uri: asset.uri,
        uploadedAt: new Date().toISOString(),
        size: asset.width && asset.height ? `${asset.width}x${asset.height}` : "unknown",
      }));

      setSelectedImages((prev) => [...prev, ...newImages]);
    }
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Camera access is required");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      aspect: [4, 3],
      allowsEditing: true,
    });

    if (!result.canceled) {
      const newImage = {
        id: `${Date.now()}_${Math.random()}`,
        uri: result.assets[0].uri,
        uploadedAt: new Date().toISOString(),
        size: "camera-capture",
      };

      setSelectedImages((prev) => [...prev, newImage]);
      setActiveTab("gallery");
    }
  };

  const removeImage = (id) => {
    setSelectedImages((prev) => prev.filter((img) => img.id !== id));
  };

  const moveImage = (fromIdx, toIdx) => {
    const newImages = [...selectedImages];
    const [movedImage] = newImages.splice(fromIdx, 1);
    newImages.splice(toIdx, 0, movedImage);
    setSelectedImages(newImages);
  };

  const handleProceed = async () => {
    if (selectedImages.length === 0) {
      Alert.alert("No images", "Please select at least one recipe image");
      return;
    }

    // Proceed with OCR processing
    navigation.navigate("OCRProcessing", { images: selectedImages });
  };

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
          Capture Recipe
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Instructions */}
      <View
        style={{
          backgroundColor: tokens.surface,
          borderBottomColor: tokens.line,
          borderBottomWidth: 1,
          padding: 16,
        }}
      >
        <Text
          style={{
            fontSize: 14,
            color: tokens.textDim,
            lineHeight: 20,
            marginBottom: 8,
          }}
        >
          📸 <Text style={{ fontWeight: "600", color: tokens.text }}>Capture recipe images</Text>
        </Text>
        <Text
          style={{
            fontSize: 13,
            color: tokens.textDim,
            lineHeight: 18,
          }}
        >
          You can take multiple screenshots (e.g., ingredients on one image, instructions on another). The app will intelligently merge them and remove duplicates.
        </Text>
      </View>

      {/* Tab Selection */}
      <View
        style={{
          flexDirection: "row",
          borderBottomColor: tokens.line,
          borderBottomWidth: 1,
          backgroundColor: tokens.surface,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("gallery")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomColor: activeTab === "gallery" ? tokens.accent : "transparent",
            borderBottomWidth: 2,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: activeTab === "gallery" ? tokens.accent : tokens.textDim,
              fontWeight: activeTab === "gallery" ? "600" : "400",
            }}
          >
            Gallery
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab("camera")}
          style={{
            flex: 1,
            paddingVertical: 12,
            borderBottomColor: activeTab === "camera" ? tokens.accent : "transparent",
            borderBottomWidth: 2,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: activeTab === "camera" ? tokens.accent : tokens.textDim,
              fontWeight: activeTab === "camera" ? "600" : "400",
            }}
          >
            Camera
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === "gallery" && (
        <View style={{ flex: 1 }}>
          {selectedImages.length === 0 ? (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
                padding: 20,
              }}
            >
              <ImageIcon size={48} color={tokens.accent} />
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: tokens.text,
                  marginTop: 12,
                  textAlign: "center",
                }}
              >
                No images selected
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: tokens.textDim,
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                Tap the button below to add recipe images
              </Text>
            </View>
          ) : (
            <FlatList
              data={selectedImages}
              keyExtractor={(item) => item.id}
              numColumns={2}
              columnWrapperStyle={{ gap: 8, paddingHorizontal: 16 }}
              contentContainerStyle={{ paddingVertical: 16, gap: 8 }}
              renderItem={({ item, index }) => (
                <View
                  style={{
                    flex: 1,
                    aspectRatio: 1,
                    position: "relative",
                  }}
                >
                  <Image
                    source={{ uri: item.uri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      borderRadius: 8,
                      borderColor: tokens.line,
                      borderWidth: 1,
                    }}
                  />

                  {/* Image Order Badge */}
                  <View
                    style={{
                      position: "absolute",
                      top: 8,
                      left: 8,
                      backgroundColor: tokens.accent,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: tokens.onAccent,
                        fontWeight: "600",
                        fontSize: 12,
                      }}
                    >
                      {index + 1}
                    </Text>
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    onPress={() => removeImage(item.id)}
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      backgroundColor: tokens.danger,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <X size={16} color="#fff" />
                  </TouchableOpacity>

                  {/* Move Up/Down Buttons */}
                  {index > 0 && (
                    <TouchableOpacity
                      onPress={() => moveImage(index, index - 1)}
                      style={{
                        position: "absolute",
                        bottom: 8,
                        left: 8,
                        backgroundColor: tokens.surface,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        borderColor: tokens.line,
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: tokens.accent,
                          fontWeight: "600",
                        }}
                      >
                        ↑
                      </Text>
                    </TouchableOpacity>
                  )}

                  {index < selectedImages.length - 1 && (
                    <TouchableOpacity
                      onPress={() => moveImage(index, index + 1)}
                      style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        backgroundColor: tokens.surface,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 4,
                        borderColor: tokens.line,
                        borderWidth: 1,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 11,
                          color: tokens.accent,
                          fontWeight: "600",
                        }}
                      >
                        ↓
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          )}
        </View>
      )}

      {activeTab === "camera" && (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Camera size={48} color={tokens.accent} />
          <Text
            style={{
              fontSize: 16,
              fontWeight: "600",
              color: tokens.text,
              marginTop: 12,
              textAlign: "center",
            }}
          >
            Ready to capture
          </Text>
          <Text
            style={{
              fontSize: 13,
              color: tokens.textDim,
              marginTop: 4,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            Tap the button below to take a photo
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View
        style={{
          backgroundColor: tokens.surface,
          borderTopColor: tokens.line,
          borderTopWidth: 1,
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        {activeTab === "gallery" ? (
          <TouchableOpacity
            onPress={pickImages}
            style={{
              backgroundColor: tokens.accent,
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <ImageIcon size={18} color={tokens.onAccent} />
            <Text
              style={{
                color: tokens.onAccent,
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Add Images from Gallery
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={takePhoto}
            style={{
              backgroundColor: tokens.accent,
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Camera size={18} color={tokens.onAccent} />
            <Text
              style={{
                color: tokens.onAccent,
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Take Photo
            </Text>
          </TouchableOpacity>
        )}

        {selectedImages.length > 0 && (
          <TouchableOpacity
            onPress={handleProceed}
            style={{
              backgroundColor: tokens.surface,
              borderColor: tokens.accent,
              borderWidth: 2,
              borderRadius: 8,
              paddingVertical: 12,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                color: tokens.accent,
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              Process {selectedImages.length} Image{selectedImages.length > 1 ? "s" : ""} →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
