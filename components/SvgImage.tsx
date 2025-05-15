import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

interface SvgImageProps {
  source: any;
  width?: number;
  height?: number;
  style?: any;
}

const SvgImage: React.FC<SvgImageProps> = ({ source, width = 200, height = 200, style }) => {
  return (
    <View style={[styles.container, { width, height }, style]}>
      <Image
        source={source}
        style={{ width: '100%', height: '100%' }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SvgImage;