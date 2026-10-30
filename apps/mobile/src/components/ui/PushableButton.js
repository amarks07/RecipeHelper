import { useState } from "react";
import { TouchableOpacity, View, StyleSheet } from "react-native";
import { useTheme } from "../../theme/ThemeProvider";
const LAYOUT_STYLE_KEYS = [
  "alignSelf",
  "bottom",
  "flex",
  "flexBasis",
  "flexGrow",
  "flexShrink",
  "height",
  "left",
  "margin",
  "marginBottom",
  "marginHorizontal",
  "marginLeft",
  "marginRight",
  "marginTop",
  "marginVertical",
  "maxHeight",
  "maxWidth",
  "minHeight",
  "minWidth",
  "position",
  "right",
  "top",
  "width",
  "zIndex",
];

export function PushableButton({
  children,
  activeOpacity = 0.78,
  style,
  onPressIn,
  onPressOut,
  ...props
}) {
  const [pressed, setPressed] = useState(false);
  const { tokens } = useTheme();
  const flattenedStyle = StyleSheet.flatten(style) || {};

  if (activeOpacity === 1) {
    return (
      <TouchableOpacity
        {...props}
        activeOpacity={activeOpacity}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={style}
      >
        {children}
      </TouchableOpacity>
    );
  }

  const layoutStyle = LAYOUT_STYLE_KEYS.reduce((result, key) => {
    if (flattenedStyle[key] !== undefined) result[key] = flattenedStyle[key];
    return result;
  }, {});
  const frontStyle = { ...flattenedStyle };
  LAYOUT_STYLE_KEYS.forEach((key) => delete frontStyle[key]);
  if (layoutStyle.width !== undefined) frontStyle.width = "100%";
  if (layoutStyle.height !== undefined) frontStyle.height = "100%";

  return (
    <TouchableOpacity
      {...props}
      activeOpacity={1}
      onPressIn={(event) => {
        setPressed(true);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        setPressed(false);
        onPressOut?.(event);
      }}
      className="pushable-back"
      style={[
        { position: "relative" },
        layoutStyle,
        {
          alignSelf: layoutStyle.alignSelf || "flex-start",
          backgroundColor: tokens.accentDeep,
          borderRadius: 12,
          overflow: "visible",
          zIndex: 1,
        },
      ]}
    >
      <View
        className="pushable-front"
        style={[
          { paddingHorizontal: 12, paddingVertical: 8 },
          frontStyle,
          {
            backgroundColor: tokens.accent,
            borderRadius: 12,
            borderWidth: 0,
            transform: [{ translateY: pressed ? -2 : -6 }],
            zIndex: 2,
          },
        ]}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
}
