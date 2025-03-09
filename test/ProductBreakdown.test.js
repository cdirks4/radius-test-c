const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProductBreakdown", function () {
  let productBreakdown;
  let owner;
  let stakeholders;

  before(async function () {
    // Get signers
    [owner, ...stakeholders] = await ethers.getSigners();

    // Deploy ProductBreakdown
    const ProductBreakdown = await ethers.getContractFactory(
      "ProductBreakdown"
    );
    productBreakdown = await ProductBreakdown.deploy();
    await productBreakdown.waitForDeployment();
  });

  describe("Payment Distribution", function () {
    const paymentAmount = ethers.parseEther("1.0"); // 1 ETH

    beforeEach(async function () {
      // Reset stakeholders
      while ((await productBreakdown.getStakeholdersCount()) > 0) {
        await productBreakdown.removeStakeholder(0);
      }

      // Add new stakeholders for test
      const testStakeholders = [
        { role: "Farmer", percentage: 6000, address: stakeholders[0].address }, // 60%
        {
          role: "Processor",
          percentage: 4000,
          address: stakeholders[1].address,
        }, // 40%
      ];

      for (const data of testStakeholders) {
        await productBreakdown.addStakeholder(
          data.address,
          data.percentage,
          data.role
        );
      }
    });

    it("Should distribute payments correctly", async function () {
      const initialBalance = await ethers.provider.getBalance(
        stakeholders[0].address
      );

      // Send payment with value
      const tx = await productBreakdown.distributePayment({
        value: paymentAmount,
      });
      await tx.wait();

      const finalBalance = await ethers.provider.getBalance(
        stakeholders[0].address
      );
      const expectedPayment = (paymentAmount * 6000n) / 10000n; // 60% of payment

      // Check if the balance increased by the expected amount
      expect(finalBalance - initialBalance).to.equal(expectedPayment);
    });

    it("Should fail if total percentage is not 100%", async function () {
      await productBreakdown.removeStakeholder(1); // Remove 40%
      await expect(
        productBreakdown.distributePayment({ value: paymentAmount })
      ).to.be.revertedWith("Total percentage must equal 100%");
    });

    it("Should emit correct events", async function () {
      await expect(productBreakdown.distributePayment({ value: paymentAmount }))
        .to.emit(productBreakdown, "PaymentReceived")
        .withArgs(owner.address, paymentAmount)
        .and.to.emit(productBreakdown, "PaymentDistributed");
    });
  });

  describe("Access Control", function () {
    it("Should only allow owner to add stakeholders", async function () {
      await expect(
        productBreakdown
          .connect(stakeholders[0])
          .addStakeholder(stakeholders[1].address, 1000, "Test")
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should only allow owner to remove stakeholders", async function () {
      await expect(
        productBreakdown.connect(stakeholders[0]).removeStakeholder(0)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
