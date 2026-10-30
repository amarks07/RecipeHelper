import { TouchableOpacity } from "react-native";
import Svg, { Path } from "react-native-svg";
import { useTheme } from "../../theme/ThemeProvider";

const PENCIL_STROKES =
  "M-16 48L32 0 M-4 48L44 0 M8 48L56 0 M20 48L68 0 M32 48L80 0 M44 48L92 0 M56 48L104 0 M68 48L116 0 M80 48L128 0 M92 48L140 0 M-12 0L36 48 M0 0L48 48 M12 0L60 48 M24 0L72 48 M36 0L84 48 M48 0L96 48 M60 0L108 48 M72 0L120 48 M84 0L132 48";

export function SketchButton({
  children,
  activeOpacity = 0.78,
  sketch = true,
  style,
  ...props
}) {
  const { tokens } = useTheme();
  const showSketch = sketch && activeOpacity !== 1;

  return (
    <TouchableOpacity
      {...props}
      activeOpacity={activeOpacity}
      style={[{ position: "relative" }, style]}
    >
      {showSketch && (
        <Svg
          pointerEvents="none"
          viewBox="0 0 120 48"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        >
          <Path
            d={PENCIL_STROKES}
            fill="none"
            stroke={tokens.text}
            strokeWidth={1.1}
            opacity={0.28}
          />
          <Path
            d="M4 3C35 0 82 5 116 2C120 14 114 32 118 45C83 50 38 43 3 46C0 33 6 16 4 3Z M6 1C39 5 79 0 114 4C112 16 119 31 115 43C84 41 36 48 5 44C8 32 2 17 6 1Z"
            fill="none"
            stroke={tokens.text}
            strokeWidth={1.5}
            strokeLinejoin="round"
            opacity={0.68}
          />
        </Svg>
      )}
      {children}
    </TouchableOpacity>
  );
}
