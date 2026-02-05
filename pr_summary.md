## Pull Request Summary: v2.10.3yyy Release

### Overview
This PR delivers the v2.10.3yyy release of the HyperSynergism mod, focusing on enhanced modding capabilities, comprehensive documentation, and code quality improvements.

### Key Features and Changes

#### 🔧 Enhanced Function Exposure
- Expanded vanilla Synergism function exposure from ~40 to 63 functions
- Improved loader compatibility with better error handling
- Added exposure for buy functions, upgrades, resets, challenges, achievements, and rune/talisman operations
- Enables more advanced modding scenarios for users

#### 📚 Documentation
- Added `exposed_functions_reference.md` - comprehensive API reference
- Documents all 63 exposed functions with usage examples
- Includes mapping from minified names to readable function names
- Serves as a developer guide for modding Synergism

#### 🧹 Code Cleanup and Optimization
- Refactored autosing module for better performance and maintainability
- Removed unused UI components (e.g., corruption loadouts modal)
- Optimized settings management and reduced code duplication
- Streamlined modal implementations

#### 🏗️ Build and Compatibility
- Updated both dev and user script loaders
- Improved build process with esbuild optimizations
- Enhanced cross-browser compatibility (Firefox/Chrome)
- Maintained backward compatibility with existing saves

### Technical Details
- **Files Added**: 1 (documentation)
- **Files Modified**: 12 (core modules, loaders, settings)
- **Files Removed**: 1 (unused UI component)
- **Build Size**: Release bundle at 791.5kb (optimized)
- **Commits**: 3 commits consolidating enhancements and merge

### Impact
- Improves mod stability and extensibility
- Provides better developer tools and documentation
- Reduces maintenance overhead through code cleanup
- Enhances user experience with more reliable function exposure

### Testing
- Verified build process completes successfully
- Confirmed function exposures work in development environment
- Validated autosing functionality remains intact
- Checked compatibility with latest Synergism updates

This release positions HyperSynergism for future enhancements while maintaining robust modding capabilities.