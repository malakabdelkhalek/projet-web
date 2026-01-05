function getFromStorage(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function saveToStorage(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function checkAuth() {
    const currentUser = getFromStorage('currentUser');
    return currentUser !== null;
}

function getCurrentUser() {
    return getFromStorage('currentUser');
}

function updateNavigation() {
    const dashboardLink = document.getElementById('dashboardLink');
    if (dashboardLink && checkAuth()) {
        dashboardLink.style.display = 'block';
    }
}

const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const messageDiv = document.getElementById('loginMessage');
        
        // Récupérer tous les utilisateurs enregistrés
        const users = getFromStorage('users') || [];
        
        // Chercher l'utilisateur
        const user = users.find(u => u.email === email && u.password === password);
        
        if (user) {
            // Connexion réussie
            saveToStorage('currentUser', user);
            messageDiv.textContent = '✅ Connexion réussie ! Redirection...';
            messageDiv.className = 'form-message success';
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            // Échec de connexion
            messageDiv.textContent = '❌ Email ou mot de passe incorrect';
            messageDiv.className = 'form-message error';
        }
    });
}

const signupForm = document.getElementById('signupForm');
if (signupForm) {
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupPasswordConfirm').value;
        const messageDiv = document.getElementById('signupMessage');
        
        if (password !== confirmPassword) {
            messageDiv.textContent = '❌ Les mots de passe ne correspondent pas';
            messageDiv.className = 'form-message error';
            return;
        }
        
        const users = getFromStorage('users') || [];
        
        if (users.some(u => u.email === email)) {
            messageDiv.textContent = '❌ Cet email est déjà utilisé';
            messageDiv.className = 'form-message error';
            return;
        }
        
        const newUser = {
            name: name,
            email: email,
            password: password,
            joinDate: new Date().toISOString()
        };
        
        users.push(newUser);
        saveToStorage('users', users);
        
        messageDiv.textContent = '✅ Inscription réussie ! Redirection vers la connexion...';
        messageDiv.className = 'form-message success';
        
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1500);
    });
}

const donationForm = document.getElementById('donationForm');
if (donationForm) {
    updateNavigation();
    
    let selectedAmount = 0;
    
    const amountButtons = document.querySelectorAll('.amount-btn');
    amountButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            amountButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedAmount = parseInt(this.dataset.amount);
            document.getElementById('customAmount').value = '';
            updateImpact(selectedAmount);
        });
    });
    
    const customAmount = document.getElementById('customAmount');
    customAmount.addEventListener('input', function() {
        amountButtons.forEach(b => b.classList.remove('active'));
        selectedAmount = parseInt(this.value) || 0;
        updateImpact(selectedAmount);
    });
    
    function updateImpact(amount) {
        const impactText = document.getElementById('impactText');
        if (amount === 0) {
            impactText.textContent = 'Sélectionnez un montant';
        } else if (amount === 10) {
            impactText.textContent = '20 repas chauds pour une famille';
        } else if (amount === 25) {
            impactText.textContent = '50 repas + médicaments essentiels';
        } else if (amount === 50) {
            impactText.textContent = '100 repas + kit d\'urgence complet';
        } else if (amount === 100) {
            impactText.textContent = '200 repas + soins médicaux pour 10 personnes';
        } else {
            const meals = amount * 2;
            impactText.textContent = `${meals} repas pour les familles dans le besoin`;
        }
    }
    
    const currentUser = getCurrentUser();
    if (currentUser) {
        document.getElementById('donorName').value = currentUser.name;
        document.getElementById('donorEmail').value = currentUser.email;
    }
    
    donationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('donorName').value;
        const email = document.getElementById('donorEmail').value;
        const type = document.getElementById('donationType').value;
        const messageDiv = document.getElementById('donationMessage');
        
        if (selectedAmount === 0) {
            messageDiv.textContent = '❌ Veuillez sélectionner un montant';
            messageDiv.className = 'form-message error';
            return;
        }
        
        if (!type) {
            messageDiv.textContent = '❌ Veuillez choisir un type d\'aide';
            messageDiv.className = 'form-message error';
            return;
        }
        
        const donation = {
            id: Date.now(),
            amount: selectedAmount,
            type: type,
            donorName: name,
            donorEmail: email,
            date: new Date().toISOString()
        };
        
        const donations = getFromStorage('donations') || [];
        donations.push(donation);
        saveToStorage('donations', donations);
        
        messageDiv.textContent = `✅ Merci ${name} ! Votre don de ${selectedAmount}DT a été enregistré avec succès !`;
        messageDiv.className = 'form-message success';
        
        setTimeout(() => {
            if (checkAuth()) {
                window.location.href = 'dashboard.html';
            } else {
                donationForm.reset();
                amountButtons.forEach(b => b.classList.remove('active'));
                selectedAmount = 0;
                updateImpact(0);
                messageDiv.style.display = 'none';
            }
        }, 2000);
    });
}

if (window.location.pathname.includes('dashboard.html')) {
    if (!checkAuth()) {
        window.location.href = 'login.html';
    }
    
    const currentUser = getCurrentUser();
    document.getElementById('userName').textContent = currentUser.name;
    
    const allDonations = getFromStorage('donations') || [];
    const userDonations = allDonations.filter(d => d.donorEmail === currentUser.email);
    
    const totalAmount = userDonations.reduce((sum, d) => sum + d.amount, 0);
    const donationCount = userDonations.length;
    const familiesHelped = Math.floor(totalAmount / 10); 
    
    let badge = 'Bronze';
    if (totalAmount >= 500) badge = '🏆 Platine';
    else if (totalAmount >= 200) badge = '🥇 Or';
    else if (totalAmount >= 100) badge = '🥈 Argent';
    else badge = '🥉 Bronze';
    
    document.getElementById('totalUserDonations').textContent = totalAmount + 'DT';
    document.getElementById('donationCount').textContent = donationCount;
    document.getElementById('familiesHelped').textContent = familiesHelped;
    document.getElementById('donorBadge').textContent = badge;
    
    document.getElementById('mealsProvided').textContent = totalAmount * 2;
    document.getElementById('medicalAid').textContent = Math.floor(totalAmount / 5);
    document.getElementById('shelterAid').textContent = Math.floor(totalAmount / 50);
    
    const donationsList = document.getElementById('donationsList');
    
    if (userDonations.length === 0) {
        donationsList.innerHTML = '<p class="no-donations">Aucun don pour le moment. Commencez par faire votre premier don !</p>';
    } else {
        donationsList.innerHTML = '';
        
        userDonations.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        userDonations.forEach(donation => {
            const date = new Date(donation.date);
            const formattedDate = date.toLocaleDateString('fr-FR');
            
            const typeLabels = {
                food: '🍲 Aide Alimentaire',
                medical: '🏥 Soins Médicaux',
                shelter: '🏠 Abris & Protection',
                education: '📚 Éducation',
                general: '❤️ Aide Générale'
            };
            
            const donationHTML = `
                <div class="donation-item">
                    <div class="donation-info">
                        <h4>${typeLabels[donation.type]}</h4>
                        <p>${formattedDate}</p>
                    </div>
                    <div class="donation-amount">${donation.amount}DT</div>
                </div>
            `;
            
            donationsList.innerHTML += donationHTML;
        });
    }
    
    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    });
}

if (window.location.pathname.includes('index.html') || window.location.pathname === '/') {
    updateNavigation();
    
    const totalDonationsElement = document.getElementById('totalDonations');
    if (totalDonationsElement) {
        const allDonations = getFromStorage('donations') || [];
        const total = allDonations.reduce((sum, d) => sum + d.amount, 0);
        const displayTotal = 12450 + total; 
        
        let currentCount = 0;
        const increment = Math.ceil(displayTotal / 50);
        
        const counter = setInterval(() => {
            currentCount += increment;
            if (currentCount >= displayTotal) {
                currentCount = displayTotal;
                clearInterval(counter);
            }
            totalDonationsElement.textContent = currentCount.toLocaleString('fr-FR') + 'DT';
        }, 30);
    }
}