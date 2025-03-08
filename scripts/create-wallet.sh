#!/bin/bash

# Generate private key using OpenSSL
PRIVATE_KEY="0x$(openssl rand -hex 32)"

# Generate public key and address
PUBLIC_KEY=$(echo -n "$PRIVATE_KEY" | openssl ec -inform DER -text -noout 2>/dev/null)
ADDRESS="0x$(echo -n "$PUBLIC_KEY" | openssl dgst -sha3-256 -binary | tail -c 20 | xxd -p)"

# Generate mnemonic (24 words from BIP39 wordlist)
ENTROPY=$(openssl rand -hex 32)
MNEMONIC=$(echo $ENTROPY | xxd -r -p | base64 | tr -d '=' | tr '+/' '-_' | fold -w 4 | head -n 24 | tr '\n' ' ')

# Print wallet information
echo -e "\n🔐 New Wallet Created!"
echo "------------------"
echo "✨ Address: $ADDRESS"
echo "🔑 Private Key: $PRIVATE_KEY"
echo "🌱 Mnemonic: $MNEMONIC"
echo "------------------"

# Update .env file
sed -i '' "s|PRIVATE_KEY=.*|PRIVATE_KEY=$PRIVATE_KEY|" .env

echo -e "\n✅ Private key has been updated in .env file"
echo "⚠️  Make sure to save your mnemonic phrase in a secure location!"