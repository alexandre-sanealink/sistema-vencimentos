import jwt from 'jsonwebtoken';

// Middleware para verificar o token JWT em cada requisição protegida
export const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.sendStatus(401); // Não autorizado (sem token)
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) {
            return res.sendStatus(403); // Proibido (token inválido)
        }
        // Adiciona os dados do usuário (id, email, role) ao objeto da requisição
        req.usuario = usuario; 
        // Passa para a próxima função da rota
        next(); 
    });
};

// Middleware para verificar se o usuário tem o papel de SUPER_ADMIN
export const verificarSuperAdmin = (req, res, next) => {
    // IMPORTANTE: Este middleware deve sempre ser usado DEPOIS do verificarToken
    if (req.usuario && req.usuario.role === 'SUPER_ADMIN') {
        // Se o usuário extraído do token tiver o papel de SUPER_ADMIN, ele pode prosseguir
        next(); 
    } else {
        // Se não, retorna um erro de acesso negado
        res.status(403).json({ message: 'Acesso negado. Requer permissão de Super Administrador.' });
    }
};