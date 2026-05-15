async function testLotCreation() {
  try {
    const signupReq = await fetch('http://localhost:8080/api/v1/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: "Test Farmer",
        email: "farmer" + Date.now() + "@test.com",
        password: "password123",
        role: "agriculteur"
      })
    });
    const signupData = await signupReq.json();
    const token = signupData.token;
    console.log("Signup success, token:", token);

    const createReq = await fetch('http://localhost:8080/api/v1/lot', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        culture: "Cacao",
        variete: "Amelonado",
        quantite: 50,
        lieu: "Lomé",
        latitude: 1.2,
        longitude: 3.4,
        date_recolte: "2026-05-15"
      })
    });

    const createData = await createReq.json();
    console.log("Create batch response:", createData);
  } catch (error) {
    console.error(error);
  }
}

testLotCreation();
