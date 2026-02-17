export const formatPhone = (value: string) => {
    if (!value) return ""
    value = value.replace(/\D/g, "")
    value = value.substring(0, 11)
    if (value.length > 10) {
        return value.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3")
    } else if (value.length > 5) {
        return value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3")
    } else if (value.length > 2) {
        return value.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2")
    } else {
        return value.replace(/^(\d*)/, "($1")
    }
}

export const formatCPF = (value: string) => {
    if (!value) return ""
    value = value.replace(/\D/g, "")
    value = value.substring(0, 11)

    if (value.length > 9) {
        return value.replace(/^(\d{3})(\d{3})(\d{3})(\d{2}).*/, "$1.$2.$3-$4")
    } else if (value.length > 6) {
        return value.replace(/^(\d{3})(\d{3})(\d{0,3}).*/, "$1.$2.$3")
    } else if (value.length > 3) {
        return value.replace(/^(\d{3})(\d{0,3}).*/, "$1.$2")
    } else {
        return value
    }
}
