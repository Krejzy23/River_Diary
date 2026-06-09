import "react-native";

declare module "react-native" {
  interface ImageProps {
    className?: string;
  }

  interface KeyboardAvoidingViewProps {
    className?: string;
  }

  interface PressableProps {
    className?: string;
  }

  interface ScrollViewProps {
    className?: string;
    contentContainerClassName?: string;
  }

  interface TextInputProps {
    className?: string;
  }

  interface TextProps {
    className?: string;
  }

  interface ViewProps {
    className?: string;
  }
}
