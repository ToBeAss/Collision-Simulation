const showVelocities = false;
const dampingFactor = 0.95;

class Particle
{
    constructor(pos, radius, color, vel)
    {
        this.pos = pos
        this.radius = radius;
        this.color = color;

        this.vel = vel || {x: 0, y: 0};
        this.mass = this.radius;

        this.instruction = null;
    }

    update(force)
    {
        if (this.instruction !== null) {
            this.instruction();
            this.instruction = null;
            return;
        }
        this.applyForce(force);
        this.move();
    }

    move()
    {
        this.pos.x += this.vel.x;
        this.pos.y += this.vel.y;
    }

    applyForce(force)
    {
        this.vel.x += force.x;
        this.vel.y += force.y;
    }

    continuousEdges(force)
    {
        let vx = this.vel.x + force.x;
        let vy = this.vel.y + force.y;
        let p0 = {x: this.pos.x, y: this.pos.y};
        let p1 = {x: p0.x + vx, y: p0.y + vy};

        let impacts = [];
        impacts.push(this.timeOfImpact(p0, p1, this.radius, 0, "y"));
        impacts.push(this.timeOfImpact(p0, p1, -this.radius, canvas.width, "x"));
        impacts.push(this.timeOfImpact(p0, p1, -this.radius, canvas.height, "y"));
        impacts.push(this.timeOfImpact(p0, p1, this.radius, 0, "x"));

        for (let tc of impacts) {
            if (tc > 0 && tc < 1) {
                let ptc = this.linearInterpolation(p0, p1, tc);

                this.draw();
                this.pos = ptc;

                if (tc == impacts[0] || tc == impacts[2]) {
                    this.vel.x = this.vel.x * dampingFactor;
                    this.vel.y = -this.vel.y * dampingFactor;
                } else if (tc == impacts[1] || tc == impacts[3]) {
                    this.vel.x = -this.vel.x * dampingFactor;
                    this.vel.y = this.vel.y * dampingFactor;
                }

                let remainingVel = {x: this.vel.x * tc - force.x, y: this.vel.y * tc - force.y};
                let predictedPos = {x: ptc.x + remainingVel.x, y: ptc.y + remainingVel.y};

                this.instruction = () => {
                    this.draw();
                    this.pos = predictedPos;
                };

                if (showVelocities) this.drawLine(ptc, predictedPos, "yellow");
                p1 = ptc
            }
        }

        if (showVelocities) {
            this.drawLine(p0, p1, "yellow");
            this.drawPoint(p0.x, p0.y, "red");
        }
    }

    linearInterpolation(point0, point1, timeStep)
    {
        let xt = timeStep * point0.x + (1 - timeStep) * point1.x;
        let yt = timeStep * point0.y + (1 - timeStep) * point1.y;
        return {x: xt, y: yt};
    }

    timeOfImpact(point0, point1, radius, border, axis)
    {
        if (axis == "x") {
            return (border + radius - point1.x) / (point0.x - point1.x);
        } else if (axis == "y") {
            return (border + radius - point1.y) / (point0.y - point1.y);
        }
    }

    checkEdges()
    {
        if (this.pos.x + this.radius >= canvas.width || this.pos.x - this.radius <= 0) {
            this.vel.x = -this.vel.x;
        }

        if (this.pos.y + this.radius >= canvas.height || this.pos.y - this.radius <= 0) {
            this.vel.y = -this.vel.y;
        }
    }

    checkOtherParticles(particleArray)
    {
        for (let otherParticle of particleArray) {
            if (otherParticle === this) continue;
            if (this.checkCollision(otherParticle)) {
                this.collisionResponse(otherParticle);
            }
        }
    }

    checkCollision(otherParticle)
    {
        let dx = otherParticle.pos.x - this.pos.x;
        let dy = otherParticle.pos.y - this.pos.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        return distance < this.radius + otherParticle.radius;
    }

    collisionResponse(otherParticle)
    {
        // STEP 1: Calculate the unit normal and unit tangent vectors
        let n = {x: otherParticle.pos.x - this.pos.x, y: otherParticle.pos.y - this.pos.y};
        let un = {x: n.x / Math.sqrt(n.x * n.x + n.y * n.y), y: n.y / Math.sqrt(n.x * n.x + n.y * n.y)};
        let ut = {x: -un.y, y: un.x};

        // STEP 2: Get initial velocity vectors
        let v1 = this.vel;
        let v2 = otherParticle.vel;

        // STEP 3: Calculate scalar velocities in the normal and tangential directions
        let v1n = v1.x * un.x + v1.y * un.y;
        let v1t = v1.x * ut.x + v1.y * ut.y;
        let v2n = v2.x * un.x + v2.y * un.y;
        let v2t = v2.x * ut.x + v2.y * ut.y;

        // STEP 4: Find the new tangential velocities after collision
        let v1tPrime = v1t;
        let v2tPrime = v2t;

        // STEP 5: Find the new normal velocities after collision
        let m1 = this.mass;
        let m2 = otherParticle.mass;

        let v1nPrime = (v1n * (m1 - m2) + 2 * m2 * v2n) / (m1 + m2);
        let v2nPrime = (v2n * (m2 - m1) + 2 * m1 * v1n) / (m1 + m2);

        // STEP 6: Convert scalar normal and tangential velocities into vectors
        let v1nPrimeVector = {x: v1nPrime * un.x, y: v1nPrime * un.y};
        let v1tPrimeVector = {x: v1tPrime * ut.x, y: v1tPrime * ut.y};
        let v2nPrimeVector = {x: v2nPrime * un.x, y: v2nPrime * un.y};
        let v2tPrimeVector = {x: v2tPrime * ut.x, y: v2tPrime * ut.y};

        // STEP 7: Add the normal and tangential components to get the final velocities
        let v1Prime = {x: v1nPrimeVector.x + v1tPrimeVector.x, y: v1nPrimeVector.y + v1tPrimeVector.y};
        let v2Prime = {x: v2nPrimeVector.x + v2tPrimeVector.x, y: v2nPrimeVector.y + v2tPrimeVector.y};

        // Update the velocities of the particles
        this.vel = v1Prime;
        otherParticle.vel = v2Prime;
    }

    draw()
    {
        ctx.globalAlpha = 1;
        if (showVelocities) ctx.globalAlpha = 0.25;
        ctx.beginPath();
        ctx.arc(this.pos.x, this.pos.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }

    drawPoint(x, y, color)
    {
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2, false);
        ctx.fillStyle = color;
        ctx.fill();
    }

    drawLine(pointA, pointB, color)
    {
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.moveTo(pointA.x, pointA.y);
        ctx.lineTo(pointB.x, pointB.y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    drawText(text, pos, offset)
    {
        ctx.globalAlpha = 1;
        ctx.fillStyle = "white";
        let s = 14;
        ctx.font = s + "px Arial";
        let w = ctx.measureText(text).width;
        ctx.fillText(text, pos.x - w/2 + offset.x, pos.y + s/2 + offset.y);
    }
}