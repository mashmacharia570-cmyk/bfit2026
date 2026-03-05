let state = {
    email: '',
    password: '',
    selectedPlatform: null,
    basePrice: 0,
    appPlan: '',
    devName: '',
    isKenya: null
};

// Replace with your actual Paystack public key from the .env file
// When deploying to Vercel, add this as an environment variable
const PAYSTACK_PUBLIC_KEY = 'pk_live_128ac008122332c4a79ff933bd29906c38902755';

window.addEventListener('load', () => {
    document.getElementById('app').classList.add('loaded');
});

function nextStep(n) {
    if (n === 2) {
        state.email = document.getElementById('email').value.trim();
        state.password = document.getElementById('password').value;

        const validEmail = "bruno@bfitworkouts.com";
        const validPassword = "0768666878";

        if (state.email !== validEmail || state.password !== validPassword) {
            alert('Invalid credentials. Access denied.');
            return;
        }
    }

    // Hide all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });

    // Special logic for summary step
    if (n === 5) {
        calculateFees();
    }

    // Show target step
    document.getElementById(`step-${n}`).classList.add('active');
}

function selectOption(event, platform, price) {
    state.selectedPlatform = platform;
    state.basePrice = price;

    document.querySelectorAll('#step-2 .option-card').forEach(card => {
        card.classList.remove('selected');
    });

    event.currentTarget.classList.add('selected');

    const nextBtn = document.getElementById('selection-next');
    nextBtn.classList.remove('disabled');
    nextBtn.disabled = false;
}

function validateStep3() {
    const appPlan = document.getElementById('app-plan').value.trim();
    const devName = document.getElementById('dev-name').value.trim().toLowerCase();

    if (!appPlan || !devName) {
        alert('Please fill in all details.');
        return;
    }

    const validNames = ['isaiah', 'macharia', 'karuga'];
    if (!validNames.includes(devName)) {
        alert('Access Denied: Invalid Developer Name.');
        return;
    }

    state.appPlan = appPlan;
    state.devName = devName;
    nextStep(4);
}

function selectRegion(event, isKenya) {
    state.isKenya = isKenya;

    document.querySelectorAll('#step-4 .option-card').forEach(card => {
        card.classList.remove('selected');
    });

    event.currentTarget.classList.add('selected');

    const nextBtn = document.getElementById('region-next');
    nextBtn.classList.remove('disabled');
    nextBtn.disabled = false;
}

function calculateFees() {
    const tax = state.basePrice * 0.3;
    const fee = state.basePrice * 0.1;
    const total = state.basePrice + tax + fee;

    document.getElementById('summary-platform').textContent = state.selectedPlatform.toUpperCase();
    document.getElementById('summary-dev').textContent = state.devName.charAt(0).toUpperCase() + state.devName.slice(1);
    document.getElementById('summary-base').textContent = `$${state.basePrice.toFixed(2)}`;
    document.getElementById('summary-tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('summary-fee').textContent = `$${fee.toFixed(2)}`;
    document.getElementById('summary-total').textContent = `$${total.toFixed(2)}`;

    const notice = document.getElementById('payment-notice');
    if (state.isKenya) {
        notice.textContent = "Paystack is available for your local bank in Kenya. Processing in USD.";
    } else {
        notice.textContent = "International payment via Paystack.";
    }
}

function payWithPaystack() {
    const payBtn = document.getElementById('pay-button');
    payBtn.textContent = "Redirecting...";
    payBtn.classList.add('disabled');
    payBtn.disabled = true;

    const tax = state.basePrice * 0.3;
    const fee = state.basePrice * 0.1;
    const amountUSD = state.basePrice + tax + fee;

    // Simple conversion: 1 USD = 130 KES
    const amountKES = Math.round(amountUSD * 130);
    const amountInCents = amountKES * 100; // Paystack expects minor units (cents/shillings * 100)

    console.log('Initiating Paystack KES Transaction:', { amountInCents, email: state.email });

    try {
        const paystack = new PaystackPop();
        paystack.newTransaction({
            key: PAYSTACK_PUBLIC_KEY,
            email: state.email,
            amount: amountInCents,
            currency: 'KES',
            metadata: {
                custom_fields: [
                    { display_name: "App Plan", variable_name: "app_plan", value: state.appPlan },
                    { display_name: "Developer Name", variable_name: "dev_name", value: state.devName },
                    { display_name: "Platform", variable_name: "platform", value: state.selectedPlatform }
                ]
            },
            onSuccess: (transaction) => {
                alert('Payment successful! Reference: ' + transaction.reference);
                window.location.reload();
            },
            onCancel: () => {
                alert('Transaction cancelled.');
                payBtn.textContent = "Pay Now";
                payBtn.classList.remove('disabled');
                payBtn.disabled = false;
            },
            onError: (error) => {
                console.error('Paystack Error:', error);
                alert('Paystack Error: ' + (error.message || 'Check browser console for details (F12).'));
                payBtn.textContent = "Pay Now";
                payBtn.classList.remove('disabled');
                payBtn.disabled = false;
            }
        });
    } catch (error) {
        console.error('Critical Paystack Error:', error);
        alert('Failed to initialize payment: ' + error.message);
        payBtn.textContent = "Pay Now";
        payBtn.classList.remove('disabled');
        payBtn.disabled = false;
    }
}
