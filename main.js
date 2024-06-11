// Define global variables and call setup function
const updateFrequency = 1000/60;
const amountOfParticles = 10; // Desired amount of particles
var particles = [];
const G = {x: 0, y: 1}; // Gravity
setup();

function setup()
{
    // Create particles
    for (let i = 0; i < amountOfParticles; i++) {
        let radius = Math.random() * 10 + 10;
        let x = Math.random() * (canvas.width - radius * 4) + radius * 2;
        let y = Math.random() * (canvas.height - radius * 4) + radius * 2;
        let color = `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;

        particles.push(new Particle({x: x, y: y}, radius, color));
    }

    // Call update function
    update();
}

function update()
{
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let particle of particles) {
        particle.update(G);
        particle.continuousEdges(G);

        particle.draw();
    }

    // Call update function every updateFrequency
    setTimeout(update, updateFrequency);
}

onkeypress = function(e) {
    if (e.key == " ") {
        update();
    }
}