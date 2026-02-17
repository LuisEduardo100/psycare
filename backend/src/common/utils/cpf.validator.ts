export function validateCPF(cpf: string): boolean {
    cpf = cpf.replace(/[^\d]+/g, '');
    if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) return false;

    const values = cpf.split('').map(el => +el);
    const rest = (count: number) => (values.slice(0, count - 12).reduce((s, z, i) => s + z * (count - i), 0) * 10) % 11 % 10;

    return rest(10) === values[9] && rest(11) === values[10];
}

export function formatCPF(cpf: string): string {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
