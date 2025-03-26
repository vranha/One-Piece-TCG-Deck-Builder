import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { ThemedText } from './ThemedText';
import { useTheme } from '@/hooks/ThemeContext';


interface CustomNumericInputProps {
    value: number;
    onChange: (value: number) => void;
    minValue?: number;
    maxValue?: number;
}

const CustomNumericInput: React.FC<CustomNumericInputProps> = ({ value, onChange, minValue = 0, maxValue = 4 }) => {
    const handleIncrement = () => {
        if (value < maxValue) {
            onChange(value + 1);
        }
    };

    const handleDecrement = () => {
        if (value > minValue) {
            onChange(value - 1);
        }
    };
        const { theme } = useTheme();

    return (
        <View style={[styles.container, { backgroundColor: Colors[theme].TabBarBackground }]}>
            <TouchableOpacity onPress={handleDecrement} style={[styles.button, { backgroundColor: Colors[theme].tabIconDefault }]}>
                <MaterialIcons name="remove" size={24} color="black" />
            </TouchableOpacity>
            <ThemedText style={styles.value}>{value}</ThemedText>
            <TouchableOpacity onPress={handleIncrement} style={[styles.button, { backgroundColor: Colors[theme].tabIconDefault }]}>
                <MaterialIcons name="add" size={24} color="black" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 10,
        borderRadius: 5,
        paddingHorizontal:10,
        paddingVertical: 5,
    },
    button: {
        padding: 3,
        borderRadius: 5,
    },
    value: {
        marginHorizontal: 10,
        fontSize: 20,
    },
});

export default CustomNumericInput;