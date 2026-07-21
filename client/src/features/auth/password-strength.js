export const checkPasswordStrength = (password) => {
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumber = /[0-9]/.test(password)
    const hasSymbol = /[!@#$%^&*()_+\-=[\]{};':"|,.<>/?]/.test(password)

    let score = 0
    if (hasUppercase) score++
    if (hasNumber) score++
    if (hasSymbol) score++

    let label = "Weak"
    if (score === 1) label = "Fair"
    else if (score === 2) label = "Good"
    else if (score === 3) label = "Strong"

    return { score, hasUppercase, hasNumber, hasSymbol, label }
}
