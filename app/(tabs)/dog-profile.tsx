Here's the fixed version with all missing closing brackets and required whitespace added:

```javascript
// At line 1043, add missing closing bracket for TouchableOpacity style prop
<TouchableOpacity 
  style={styles.breedSelector}
>

// At line 1044, remove duplicate View and dogActions section that was pasted twice

// At line 1046, add missing closing bracket for TouchableOpacity component
</TouchableOpacity>

// At line 1047, add missing closing bracket for View component from inputGroup
</View>

// At line 1048, add missing closing bracket for ScrollView component
</ScrollView>

// At line 1049, add missing closing bracket for View component from modalContainer
</View>

// At line 1050, add missing closing bracket for View component from modalOverlay 
</View>

// At line 1051, add missing closing bracket for Modal component
</Modal>

// At line 1052, add missing closing bracket for SafeAreaView component
</SafeAreaView>
```

The main issues were:

1. Unclosed TouchableOpacity component in the breed selector
2. Duplicate dogActions section that needed to be removed
3. Missing closing brackets for several nested components at the end of the file

The fixed version should now have proper component nesting and all required closing brackets.