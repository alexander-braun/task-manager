const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/user");
const { user1ID, user1, setupDatabase } = require("./fixtures/db");

// Jest setup
const sendMailMock = jest.fn();
jest.mock("nodemailer");
const nodemailer = require("nodemailer"); //doesn't work with import. idk why
nodemailer.createTransport.mockReturnValue({ sendMail: sendMailMock });

beforeEach(() => {
  sendMailMock.mockClear();
  nodemailer.createTransport.mockClear();
});

beforeEach(setupDatabase);

test("Should signup a new user", async () => {
  const response = await request(app)
    .post("/users")
    .send({
      name: "Alex",
      email: "4lexanderbraun@gmail.com",
      password: "MyTestPassword!",
    })
    .expect(201);

  // Assert database was changed correctly
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: "Alex",
      email: "4lexanderbraun@gmail.com",
    },
    token: user.tokens[0].token,
  });

  // Password not plaintext
  expect(user.password).not.toBe("MyTestPassword!");

  // Email was send
  expect(sendMailMock).toHaveBeenCalled();
});

test("Should login existing user", async () => {
  const response = await request(app)
    .post("/users/login")
    .send({
      email: user1.email,
      password: user1.password,
    })
    .expect(200);

  // users second token is the same as response token
  // (second token because user at top of page has 1 token already)
  const user = await User.findById(response.body.user._id);
  expect(user.tokens[1].token).toBe(response.body.token);
});

test("Should not login nonexisting user", async () => {
  await request(app)
    .post("/users/login")
    .send({
      email: "4lexanderbraun@gmail.com",
      password: "12345678",
    })
    .expect(400);
});

test("Should get profile for user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200);
});

test("Should get profile for user", async () => {
  await request(app)
    .get("/users/me")
    .set("Authorization", `Bearer 324`)
    .send()
    .expect(401);
});

test("Patch user name", async () => {
  const response = await request(app)
    .patch("/users/me")
    .set("Authorization", `Bearer ${user1.tokens[0].token}`)
    .send({ name: "dieter" })
    .expect(200);

  const user = await User.findById(user1ID);
  expect(user.name).toBe("dieter");
});

test("Should delete account for user", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer ${user1.tokens[0].token}`)
    .send()
    .expect(200);

  // User is now null
  const user = await User.findById(user1ID.toString());
  expect(user).toBeNull();

  // Email was send
  expect(sendMailMock).toHaveBeenCalled();
});

test("Should not delete unnauthenticated user", async () => {
  await request(app)
    .delete("/users/me")
    .set("Authorization", `Bearer 123`)
    .send()
    .expect(401);
});
