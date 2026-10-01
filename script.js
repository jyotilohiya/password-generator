document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements Cache
    const passwordDisplay = document.getElementById('password-display');
    const copyBtn = document.getElementById('copy-btn');
    const lengthSlider = document.getElementById('length-slider');
    const lengthVal = document.getElementById('length-val');
    
    const uppercaseCb = document.getElementById('uppercase-cb');
    const lowercaseCb = document.getElementById('lowercase-cb');
    const numbersCb = document.getElementById('numbers-cb');
    const symbolsCb = document.getElementById('symbols-cb');
    const excludeAmbiguousCb = document.getElementById('exclude-ambiguous-cb');
    const checkboxes = [uppercaseCb, lowercaseCb, numbersCb, symbolsCb];
    
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    const generateBtn = document.getElementById('generate-btn');
    const toast = document.getElementById('toast');

    // Character Sets Dictionary
    const charSets = {
        uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
        lowercase: 'abcdefghijklmnopqrstuvwxyz',
        numbers: '0123456789',
        symbols: '@#$%^&*()_+~|}{[]:;?><,./-='
    };
    
    // Characters to exclude if the option is checked
    const ambiguousChars = 'il1Lo0O';

    /**
     * Helper to get a secure random integer between 0 and max - 1
     * @param {number} max - The upper bound (exclusive)
     * @returns {number}
     */
    const getSecureRandom = (max) => {
        const array = new Uint32Array(1);
        window.crypto.getRandomValues(array);
        return array[0] % max;
    };

    /**
     * Updates the custom range slider visual fill tracking
     */
    const updateSliderUI = () => {
        const val = lengthSlider.value;
        const min = lengthSlider.min;
        const max = lengthSlider.max;
        const percentage = ((val - min) / (max - min)) * 100;
        
        // Dynamically color track before and after the thumb
        lengthSlider.style.background = `linear-gradient(to right, var(--primary-color) ${percentage}%, var(--border-color) ${percentage}%)`;
    };

    /**
     * Analyzes password length and character variety to determine strength
     * @param {number} length 
     * @param {number} typesCount 
     */
    const calculateStrength = (length, typesCount) => {
        let strength = 'weak';
        
        if (length >= 12 && typesCount >= 3) {
            strength = 'strong';
        } else if (length >= 8 && typesCount >= 2) {
            strength = 'medium';
        } else if (length >= 10 && typesCount === 1) {
            // A long password with only one character type is just medium
            strength = 'medium';
        }

        // Update UI DOM Attributes and Text
        strengthBar.setAttribute('data-strength', strength);
        strengthText.textContent = strength.charAt(0).toUpperCase() + strength.slice(1);
        strengthText.className = strength;
    };

    /**
     * Core function to build the character pool and generate the password
     */
    const generatePassword = () => {
        let length = parseInt(lengthSlider.value);
        let charPool = '';
        let guaranteedChars = [];
        
        const isExcludeAmbiguous = excludeAmbiguousCb.checked;

        // Helper to filter out ambiguous characters from a given string
        const filterAmbiguous = (str) => {
            return str.split('').filter(c => !ambiguousChars.includes(c)).join('');
        };

        // 1. Build the pool based on selections & pick 1 guaranteed character per checked option
        if (uppercaseCb.checked) {
            const p = isExcludeAmbiguous ? filterAmbiguous(charSets.uppercase) : charSets.uppercase;
            charPool += p;
            guaranteedChars.push(p[getSecureRandom(p.length)]);
        }
        if (lowercaseCb.checked) {
            const p = isExcludeAmbiguous ? filterAmbiguous(charSets.lowercase) : charSets.lowercase;
            charPool += p;
            guaranteedChars.push(p[getSecureRandom(p.length)]);
        }
        if (numbersCb.checked) {
            const p = isExcludeAmbiguous ? filterAmbiguous(charSets.numbers) : charSets.numbers;
            charPool += p;
            guaranteedChars.push(p[getSecureRandom(p.length)]);
        }
        if (symbolsCb.checked) {
            const p = charSets.symbols; // Ambiguous chars don't usually apply to symbols
            charPool += p;
            guaranteedChars.push(p[getSecureRandom(p.length)]);
        }

        // 2. Fill the remaining needed length from the entire pool
        let generatedPassword = '';
        for (let i = guaranteedChars.length; i < length; i++) {
            generatedPassword += charPool[getSecureRandom(charPool.length)];
        }

        // 3. Append the guaranteed chars to ensure inclusion
        generatedPassword += guaranteedChars.join('');
        
        // 4. Shuffle the final password string for randomness (Fisher-Yates)
        let passArray = generatedPassword.split('');
        for (let i = passArray.length - 1; i > 0; i--) {
            const j = getSecureRandom(i + 1);
            [passArray[i], passArray[j]] = [passArray[j], passArray[i]];
        }
        
        const finalPassword = passArray.join('');
        
        // 5. Update UI values and triggers visual effects
        passwordDisplay.value = finalPassword;
        triggerInputFlash();

        // 6. Update Strength UI
        const typesCount = [uppercaseCb.checked, lowercaseCb.checked, numbersCb.checked, symbolsCb.checked].filter(Boolean).length;
        calculateStrength(length, typesCount);
    };

    /**
     * Temporarily flashes the input field text to indicate a new password was generated
     */
    const triggerInputFlash = () => {
        passwordDisplay.style.opacity = '0.4';
        setTimeout(() => {
            passwordDisplay.style.opacity = '1';
            passwordDisplay.style.transition = 'opacity 0.2s ease-in';
        }, 50);
    };

    /**
     * Prevents the user from unchecking all requirement checkboxes.
     * At least one character type must always be selected.
     * @param {Event} e - Checkbox change event
     */
    const handleCheckboxChange = (e) => {
        const checkedCount = checkboxes.filter(cb => cb.checked).length;
        if (checkedCount === 0) {
            e.target.checked = true; // Re-check the box if it was the last one
        } else {
            generatePassword(); // Generate fresh password on valid options change
        }
    };

    /**
     * Copies the current generated password to the clipboard using the modern Clipboard API
     */
    const copyToClipboard = async () => {
        if (!passwordDisplay.value) return;
        
        try {
            await navigator.clipboard.writeText(passwordDisplay.value);
            
            // Icon visual feedback
            const icon = copyBtn.querySelector('i');
            icon.className = 'fa-solid fa-check';
            copyBtn.style.color = '#fff';
            
            // Show toast notification
            toast.classList.add('show');
            
            // Revert after 2 seconds
            setTimeout(() => {
                icon.className = 'fa-regular fa-copy';
                copyBtn.style.color = 'var(--primary-color)';
                toast.classList.remove('show');
            }, 2000);
            
        } catch (err) {
            console.error('Failed to copy password: ', err);
            // Fallback for older browsers if needed could be added here
        }
    };

    // --- EVENT LISTENERS ---

    // Slider input changes (realtime drag)
    lengthSlider.addEventListener('input', (e) => {
        lengthVal.textContent = e.target.value;
        updateSliderUI();
        generatePassword(); // Live generate while sliding
    });

    // Checkbox changes
    checkboxes.forEach(cb => cb.addEventListener('change', handleCheckboxChange));
    excludeAmbiguousCb.addEventListener('change', generatePassword);
    
    // Button clicks
    generateBtn.addEventListener('click', generatePassword);
    copyBtn.addEventListener('click', copyToClipboard);

    // --- INITIALIZATION ---
    updateSliderUI();
    generatePassword();
});
