document.addEventListener('DOMContentLoaded', () => {
    auth.onAuthStateChanged(user => {
        if (user) window.location.href = 'chat.html';
    });

    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab;
            tabs.forEach(t => t.classList.remove('active'));
            forms.forEach(f => f.classList.remove('active'));
            tab.classList.add('active');
            document.getElementById(`${target}-form`).classList.add('active');
            clearError();
        });
    });

    const errorEl = document.getElementById('auth-error');
    function showError(msg) { errorEl.textContent = msg; }
    function clearError() { errorEl.textContent = ''; }

    function translateError(code) {
        const errors = {
            'auth/email-already-in-use': 'Этот email уже зарегистрирован',
            'auth/invalid-email': 'Некорректный email',
            'auth/weak-password': 'Пароль должен быть минимум 6 символов',
            'auth/user-not-found': 'Пользователь не найден',
            'auth/wrong-password': 'Неверный пароль',
            'auth/invalid-credential': 'Неверный email или пароль',
            'auth/too-many-requests': 'Слишком много попыток. Попробуйте позже',
            'auth/popup-closed-by-user': 'Окно входа было закрыто',
            'auth/unauthorized-domain': 'Домен не разрешён. Добавьте его в Firebase Console',
        };
        return errors[code] || `Ошибка: ${code}`;
    }

    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();
        const name = document.getElementById('register-name').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value;
        if (!name) return showError('Введите имя');
        try {
            const cred = await auth.createUserWithEmailAndPassword(email, password);
            await cred.user.updateProfile({ displayName: name });
            await db.collection('users').doc(cred.user.uid).set({
                name, email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            window.location.href = 'chat.html';
        } catch (err) { showError(translateError(err.code)); }
    });

    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        clearError();
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        try {
            await auth.signInWithEmailAndPassword(email, password);
            window.location.href = 'chat.html';
        } catch (err) { showError(translateError(err.code)); }
    });

    document.getElementById('google-login').addEventListener('click', async () => {
        clearError();
        try {
            const result = await auth.signInWithPopup(googleProvider);
            if (result.additionalUserInfo?.isNewUser) {
                await db.collection('users').doc(result.user.uid).set({
                    name: result.user.displayName || 'Пользователь',
                    email: result.user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            window.location.href = 'chat.html';
        } catch (err) { showError(translateError(err.code)); }
    });
});
