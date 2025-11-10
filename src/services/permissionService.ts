const DEFAULT_PERMISSIONS = [
  'auth:register',
  'auth:login',
  'auth:token:validate',
  'profile:read',
];

export async function getUserPermissions(_userId: string): Promise<string[]> {
  // Em um cenário real, faça uma consulta ao banco ou a um serviço de autorização.
  // Mantemos um conjunto padrão para simplificar enquanto regras específicas não são necessárias.
  return DEFAULT_PERMISSIONS;
}
