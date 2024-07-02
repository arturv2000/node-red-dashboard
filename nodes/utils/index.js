function asyncEvaluateNodeProperty(RED, value, type, node, msg) {
    return new Promise(function (resolve, reject) {
        RED.util.evaluateNodeProperty(value, type, node, msg, function (e, r) {
            if (e) {
                reject(e)
            } else {
                resolve(r)
            }
        })
    })
}

async function appendTopic(RED, config, wNode, msg) {
    // populate topic if the node specifies one
    if (config.topic || config.topicType) {
        try {
            msg.topic = await asyncEvaluateNodeProperty(RED, config.topic, config.topicType || 'str', wNode, msg) || ''
        } catch (_err) {
            // do nothing
            console.error(_err)
        }
    }

    // ensure we have a topic property in the msg, even if it's an empty string
    if (!('topic' in msg)) {
        msg.topic = ''
    }

    return msg
}

/**
 * Adds socket/client data to a msg payload, if enabled
 *
 */
function addConnectionCredentials(RED, msg, conn, config) {
    if (config.includeClientData) {
        if (!msg._client) {
            msg._client = {}
        }
        console.log('calling callback')
        let _answer
        if (RED.settings?.dashboard?.socketIOGetIpFromHeader) {
            _answer = RED.settings.dashboard.socketIOGetIpFromHeader(conn.handshake?.headers)
        }
        let _ipAddress = conn.handshake?.address
        if (_answer !== undefined) {
            _ipAddress = _answer
        }
        console.log('callback called')
        console.log('Answer -> ' + _answer)
        RED.plugins.getByType('node-red-dashboard-2').forEach(plugin => {
            if (plugin.hooks?.onAddConnectionCredentials && msg) {
                msg = plugin.hooks.onAddConnectionCredentials(conn, msg)
            }
        })
        msg._client = {
            ...msg._client,
            ...{
                socketId: conn.id,
                socketIp: _ipAddress
            }
        }
    }
    return msg
}

module.exports = {
    asyncEvaluateNodeProperty,
    appendTopic,
    addConnectionCredentials
}
