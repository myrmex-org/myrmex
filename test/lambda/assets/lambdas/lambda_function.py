def lambda_handler(event, context):
    if len(event['password']) < 6:
        return 'Password must be 6 character long minimum'
    return 'cryptographed password'
