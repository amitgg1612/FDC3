type ChannelId = string;

/**
 * Object representing a context channel.
 * 
 * All interactions with a context channel happen through the methods on here.
 */
declare class Channel {
    /**
     * Constant that uniquely identifies this channel. Will be generated by the service, and guarenteed to be unique
     * within the set of channels registered with the service.
     * 
     * In the case of `desktop` channels (see {@link DesktopChannel}), these id's _should_ persist across sessions. The 
     * channel list is defined by the service, but can be overridden by a desktop owner. If the desktop owner keeps 
     * this list static (which is recommended), then id's will also persist across sessions.
     */
    public readonly id: ChannelId;

    /**
     * Uniquely defines each channel type.
     * 
     * See overrides of this class for list of allowed values.
     */
    public readonly type: string;

    /**
     * Broadcasts the given context on this channel. This is equivilant to joining the channel and then calling the 
     * top-level FDC3 `broadcast` function.
     * 
     * Note that this function can be used without first joining the channel, allowing applications to broadcast on
     * channels that they aren't a member of.
     * 
     * This broadcast will be received by all windows that are members of this channel, *except* for the window that
     * makes the broadcast. This matches the behaviour of the top-level FDC3 `broadcast` function.
     */
    public broadcast(context: Context): Promise<void>;

    /**
     * Returns the last context that was broadcast on this channel. All channels initially have no context, until a 
     * window is added to the channel and then broadcasts. If there is not yet any context on the channel, this method
     * will return `null`. The context is also reset back into it's initial context-less state whenever a channel is
     * cleared of all windows.
     * 
     * The context of a channel will be captured regardless of how the context is broadcasted on this channel - whether
     * using the top-level FDC3 `broadcast` function, or using the channel-level {@link broadcast} function on this 
     * object.
     * 
     * NOTE: Only non-default channels are stateful, for the default channel this method will always return `null`.
     */
    public getCurrentContext(): Promise<Context|null>;

    /**
     * Event that is fired whenever a window broadcasts on this channel.
     * 
     * The `channel` property within the event will always be this channel instance.
     */
    public addEventListener(event: 'broadcast', listener: (event: {channel: Channel; context: Context}) => void): void;

    /**
     * Remove this event listener
     * 
     */
    public removeEventListener(event: 'broadcast', listener: (event: {channel: Channel; context: Context}) => void): void;
}

/**
 * All windows will start off in this channel.
 * 
 * Unlike desktop channels, the default channel has no pre-defined name or visual style. It is up to apps to display 
 * this in the channel selector as they see fit - it could be as "default", or "none", or by "leaving" a user channel.
 */
declare class DefaultChannel extends Channel {
    type: 'default';
}

/**
 * User-facing channels, to display within a colour picker or channel selector component.
 * 
 * This list of channels should be considered fixed by applications - the service will own the list of user channels,
 * making the same list of channels available to all applications, and this list will not change over the lifecycle of
 * the service.
 * 
 * We do not intend to support creation of 'user' channels at runtime, as this then adds considerable complexity when
 * implementing a channel selector component (must now support events, 'create channel' UI, reflowing of channel 
 * list, etc).
 */
declare class DesktopChannel extends Channel {
    type: 'desktop';

    /**
     * A user-readable name for this channel, e.g: `"Red"`
     */
    name: string;

    /**
     * The color that should be associated within this channel when displaying this channel in a UI, e.g: `0xFF0000`.
     */
    color: number;

    /*
    //glyph?
    */
}

/**
 * A special channel that receives all broadcasts, from all windows.
 * 
 * NOTE: This re-defines the term "global channel" - what was previously called the "global" channel is now 
 * the "default" channel.
 */
declare class GlobalChannel extends Channel {
    type: 'global';

    // No `name` or `color` on the global channel
}

/**
 * Applications can create custom channels for specialised use-cases. Note that these channels would only be known
 * about to the app that created them. They can be joined by any window, but there would be no way to discover them
 * from the service's API - it would be up to applications to decide how to share the channel ID with other
 * windows/applications.
 */
declare class AppChannel extends Channel {
    /**
     * Registers a new {@link AppChannel}. The service will generate an ID for the channel - the ID will be a
     * random string, known only to whoever calls this function. The ID's of these channels will be long randomized 
     * strings.
     * 
     * It is up to applications to manage how to share knowledge of these custom channels across windows and to manage
     * channel ownership and lifecycle.
     */
    public static create(): Promise<AppChannel>;

    /**
     * Allows other applications to fetch an {@link AppChannel} instance of an existing application channel. This can
     * be used to allow other windows to connect to an existing channel.
     * 
     * The service will allow any window to wrap and these channels, but it is up to the application to decide how to
     * communicate the existance of these channels.
     * 
     * TBD: How to handle wrapping/usage of a channel that doesn't exist.
     * 
     * @param uuid The UUID of the application that created the channel
     * @param channelId The service-defined channel ID, returned via the call to {@link create}
     */
    public static wrap(uuid: string, channelId: string): AppChannel;


    type: 'app';

    // Possibly some additional fields, TBD.
}

/**
 * Channels API is namespaced under a `channels` object.
 * 
 * ```
 * import {channels} from '???';
 * 
 * channels.getDesktopChannels().then((channels: Channel[]) => {
 *     channels[0].joinChannel();
 * });
 * ```
 * 
 */
declare module channels {
    /**
     * Allows access to the default channel. All windows will start out in this channel, and will remain in that 
     * channel unless they explicitly {@link Channel.join | joining} another.
     * 
     * Applications can leave a {@link DesktopChannel} by re-joining the default channel.
     */
    const defaultChannel: Channel;

    /**
     * 
     */
    function getDesktopChannels(): Promise<DesktopChannel[]>;
}